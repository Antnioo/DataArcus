// 0.3.0 L2 (the polish lab of 12-13 Oct, Desktop 2.158): the look options the lab proved, as plan options pinned by the
// plan. Written red first. Through the tools only (plan_layout -> approve_plan -> create_report), on a made-up shop model
// (no employer or client data):
//   S    the inputs (slicerStyle, grid) on plan_layout and create_report; the instructions and the skill say when each fits
//   D    defaults: every slicer a dropdown with the rounded box (rail, slide-in panel, phone), gridlines as before
//   P    pills + dotted (English): the button slicer for the fields of 2-6 known values, a dropdown for the others (told
//        with why); the dotted value-axis gridlines on every chart; the plan pins them, the approval page names them, its
//        preview draws them; validator 0 errors, check_report 0 "can break"
//   PIN  a create_report with another value than the plan is refused and writes nothing; left out, the plan's is written
//   N    grid none: no gridlines
//   A    Arabic, right to left: the pills read from the right (sorted descending on one row)
//   TW   the Arabic twin of the English report keeps the pills (right to left) and the dotted grid
//   SEL  the pills' entries both ways (state selectors, and none): Microsoft's validator on each
//   node test-0.3.0-look-options.mjs
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

// ---------- the made-up model: a shop's sales, with a 3-value band, a Boolean and a free text column ----------
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-l2-'));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
fs.mkdirSync(path.join(ROOT, 'g/Shop.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'g/Shop.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string'), col('Channel', 'string'), col('Is Online', 'boolean'), col('Date', 'dateTime'),
    { name: 'Size Band', type: 'calculated', dataType: 'string', expression: 'SWITCH ( TRUE (), Sales[Amount] > 1000, "Large", Sales[Amount] > 100, "Medium", "Small" )' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '"AED" #,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime', { isKey: true }), col('Month Name', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Quarter', 'string')] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));
fs.writeFileSync(path.join(ROOT, 'g/Shop.pbip'), JSON.stringify({ version: '1.0', artifacts: [] }));
const MP = 'g';
const FIELDS = { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], measure: 'Sales[Total Sales]', timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]', category2: 'Sales[Channel]',
  slicers: ['Sales[Size Band]', 'Sales[Is Online]', 'Sales[Region]'] };
// a design with the slicers in a strip on top (the plan's slicers need a layout with filters)
const DES = { layout: 'exec', filters: 'top', secondPage: false };
const AR_NAMES = { 'Sales[Total Sales]': 'إجمالي المبيعات', 'Sales[Orders]': 'الطلبات', 'Calendar[Month Name]': 'الشهر', 'Sales[Region]': 'المنطقة', 'Sales[Channel]': 'القناة', 'Sales[Size Band]': 'فئة الحجم', 'Sales[Is Online]': 'عبر الإنترنت' };

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (planId) => { const n = links().length; await w.call('approve_plan', { planId }); const url = await linkAt(n), html = await req(url, 'GET'); if (url) await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId }); return html; };
const pagesOf = (dir) => { const P = path.join(dir, 'definition/pages'); if (!fs.existsSync(P)) return [];
  return rd(path.join(P, 'pages.json')).pageOrder.map((id) => ({ id, page: rd(path.join(P, id, 'page.json')), visuals: fs.existsSync(path.join(P, id, 'visuals')) ? fs.readdirSync(path.join(P, id, 'visuals')).map((v) => {
    const d = path.join(P, id, 'visuals', v), j = rd(path.join(d, 'visual.json')); return Object.assign(j, { mobile: fs.existsSync(path.join(d, 'mobile.json')) ? rd(path.join(d, 'mobile.json')) : null }); }).filter((v) => v.visual) : [] })); };
const shownPages = (dir) => pagesOf(dir).filter((p) => p.page.type !== 'Tooltip');
const allVisuals = (dir) => shownPages(dir).flatMap((p) => p.visuals);
const fieldOf = (v) => (((((v.visual.query || {}).queryState || {}).Values || {}).projections || [])[0] || { field: {} }).field.Column?.Property;
const entries = (v, o) => ((v.visual.objects || {})[o]) || [];
const entry = (v, o, id) => entries(v, o).find((e) => (id ? e.selector && e.selector.id === id : !e.selector)) || null;
const P = (v, o, id) => (entry(v, o, id) || { properties: {} }).properties;
const CHART_TYPES = /^(lineChart|clusteredBarChart|clusteredColumnChart|columnChart|barChart)$/;
const charts = (vs) => vs.filter((v) => CHART_TYPES.test(v.visual.visualType) && v.visual.query);
const pills = (vs) => vs.filter((v) => v.visual.visualType === 'advancedSlicerVisual');
const dropdowns = (vs) => vs.filter((v) => v.visual.visualType === 'slicer');
const rounded = (v) => S(P(v, 'dropdown').borderRadius) === '8D' && S(P(v, 'dropdown').borderIndividualCorners) === 'false' && !!P(v, 'dropdown').borderColor && S(P(v, 'data').mode) === 'Dropdown';
const check = async (pbip) => w.call('check_report', { path: pbip, checks: ['validator'] });
const clean = (r) => !!r && !r.err && r.j.validator && r.j.validator.ran && r.j.validator.errors === 0;
const noBreak = (r) => !!r && !r.err && r.j.impact && r.j.impact.kinds && (r.j.impact.kinds.canBreak || { count: 0 }).count === 0;
const valErr = (r) => (r && r.j && r.j.validator ? JSON.stringify(r.j.validator).slice(0, 600) : short(r));

// plan + approve + write; cr: what create_report gets on top of the plan's own inputs (look options left out by default,
// so the plan's values are filled in)
const write = async (args, crOver) => {
  const pl = await w.call('plan_layout', Object.assign({ path: MP }, args));
  const id = pl.j && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, err: 'no plan id: ' + short(pl) };
  const html = await approve(id);
  const cr = Object.assign({ path: MP, planId: id }, args, args.pages ? {} : { design: pl.j.design });
  delete cr.slicerStyle; delete cr.grid;
  if (args.planFields) { cr.fields = args.planFields; delete cr.planFields; }
  const r = await w.call('create_report', Object.assign(cr, crOver || {}));
  return { pl, html, r, id, dir: path.join(ROOT, 'g', args.name + '.Report'), pbip: 'g/' + args.name + '.pbip' };
};

try {
  // ---------- S: the inputs and the texts ----------
  {
    const tools = (await w.c.listTools()).tools, pl = tools.find((t) => t.name === 'plan_layout'), cr = tools.find((t) => t.name === 'create_report');
    const en = (t, k) => (((t.inputSchema.properties || {})[k]) || {}).enum || [];
    chk(() => [pl, cr].every((t) => JSON.stringify(en(t, 'slicerStyle')) === '["dropdown","pills"]' && JSON.stringify(en(t, 'grid')) === '["solid","dotted","none"]'),
      () => `S1. plan_layout and create_report take slicerStyle dropdown|pills and grid solid|dotted|none: ${JSON.stringify([en(pl, 'slicerStyle'), en(pl, 'grid'), en(cr, 'slicerStyle'), en(cr, 'grid')])}`);
    const d = String(pl.inputSchema.properties.slicerStyle?.description || '') + ' ' + String(pl.inputSchema.properties.grid?.description || '');
    chk(() => /2-6|two to six/i.test(d) && /dropdown/i.test(d) && /dotted/i.test(d) && /default/i.test(d), () => `S2. the descriptions say when each fits: ${d}`);
    const ins = w.c.getInstructions() || '', skill = fs.readFileSync(path.join(HERE, 'skills/report-design/SKILL.md'), 'utf8');
    chk(() => /slicerStyle/.test(skill) && /pills/.test(skill) && /grid/.test(skill) && /dotted/.test(skill), () => 'S3. the skill says when pills and the dotted grid fit');
    // (the server's instructions are at their cap; the options are said where they are passed, in both tools' inputs)
    const dc = String(cr.inputSchema.properties.slicerStyle?.description || '') + ' ' + String(cr.inputSchema.properties.grid?.description || '');
    chk(() => dc === d && ins.length <= 2200, () => `S4. create_report says the same as plan_layout (one definition), the instructions within their cap: ${ins.length}`);
  }

  // ---------- D: defaults ----------
  {
    const D = await write({ name: 'Look Default', lang: 'en', ...DES, planFields: FIELDS });
    const vs = D.dir && fs.existsSync(D.dir) ? allVisuals(D.dir) : [];
    chk(() => dropdowns(vs).length === 3 && !pills(vs).length && dropdowns(vs).every(rounded), () => `D1. default: three dropdown slicers, each with the rounded box: ${D.err || short(D.r)} ${JSON.stringify(dropdowns(vs).map((v) => v.visual.objects))}`);
    chk(() => charts(vs).length >= 3 && charts(vs).every((v) => !('gridlineStyle' in P(v, 'valueAxis')) && !('gridlineShow' in P(v, 'valueAxis'))), () => `D2. default: the gridlines as before (no style, not hidden): ${JSON.stringify(charts(vs).map((v) => P(v, 'valueAxis')))}`);
    chk(() => dropdowns(vs).every((v) => v.mobile && !(((v.mobile.visual || {}).objects || {}).dropdown)), () => `D3. the phone layout keeps the page's rounded box (mobile.json writes no dropdown card): ${JSON.stringify(dropdowns(vs).map((v) => v.mobile))}`);
    const look = (D.pl.j || {}).look || (((D.pl.j || {}).plan || {}).look) || null;
    chk(() => JSON.stringify(D.pl.j).includes('"slicerStyle":"dropdown"') && JSON.stringify(D.pl.j).includes('"grid":"solid"'), () => `D4. the plan's look names the defaults: ${JSON.stringify(look)}`);
    const c = D.r && !D.r.err ? await check(D.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `D5. validator 0 errors and 0 "can break" on the default report: ${valErr(c)}`);
    // the designs' slicers: the rail and the slide-in panel
    for (const slidePanel of [false, true]) {
      const R = await write({ name: 'Look Rail ' + slidePanel, lang: 'en', layout: 'analysis', filters: 'start', slidePanel, secondPage: false, planFields: FIELDS });
      const rv = R.dir && fs.existsSync(R.dir) ? allVisuals(R.dir) : [];
      chk(() => dropdowns(rv).length >= 2 && dropdowns(rv).every(rounded), () => `D6 (slidePanel ${slidePanel}): every dropdown of a design rounded: ${R.err || short(R.r)} ${JSON.stringify(dropdowns(rv).map((v) => v.visual.objects.dropdown))}`);
    }
  }

  // ---------- P: pills + dotted, English ----------
  let EN = null;
  {
    EN = await write({ name: 'Look Pills', lang: 'en', ...DES, planFields: FIELDS, slicerStyle: 'pills', grid: 'dotted' });
    const vs = EN.dir && fs.existsSync(EN.dir) ? allVisuals(EN.dir) : [], ps = pills(vs), dd = dropdowns(vs);
    chk(() => ps.length === 2 && JSON.stringify(ps.map(fieldOf).sort()) === '["Is Online","Size Band"]' && dd.length === 1 && fieldOf(dd[0]) === 'Region' && rounded(dd[0]),
      () => `P1. pills for the 3-value band and the Boolean, the rounded dropdown for Region: ${EN.err || short(EN.r)} ${JSON.stringify(vs.filter((v) => /slicer/i.test(v.visual.visualType)).map((v) => [v.visual.visualType, fieldOf(v)]))}`);
    const band = ps.find((v) => fieldOf(v) === 'Size Band'), online = ps.find((v) => fieldOf(v) === 'Is Online');
    chk(() => band && S(P(band, 'shapeCustomRectangle').tileShape) === 'pill' && S(P(band, 'layout').rowCount) === '1L' && S(P(band, 'layout').columnCount) === '3L' && S(P(online, 'layout').columnCount) === '2L',
      () => `P2. the pill shape on one row, a column per value: ${JSON.stringify(band && band.visual.objects)}`);
    chk(() => band && S(P(band, 'fillCustom').show) === 'true' && P(band, 'fillCustom', 'default').fillColor && P(band, 'fillCustom', 'selected').fillColor && P(band, 'value', 'selected').fontColor && S(P(band, 'outline', 'default').show) === 'true',
      () => `P3. the calm fill (default), the accent (selected) and its text, the outline: ${JSON.stringify(band && band.visual.objects)}`);
    const colourOf = (p) => (p && p.solid && p.solid.color ? S(p.solid.color) : null);
    chk(() => band && colourOf(P(band, 'fillCustom', 'selected').fillColor) !== colourOf(P(band, 'fillCustom', 'default').fillColor), () => 'P4. the selected pill stands out from the others');
    // P5 (F1, the laptop proof on Desktop 2.159: every pill drawn with no text): the item text, the button slicer's
    // "Values" card, is written as the new card's value is measured to need (round 0): everything under the default
    // selector, show included, no entry without a selector; its outline likewise
    // P6 (F1, the owner's idea with the proof's screenshot: the pills shorter than the dropdown, their header bigger, and
    // a button slicer hides a text that does not fit): the pill's header (its container title) written at the text size
    // the tiles use, and the visual as high as the header and one row of tiles need: header ceil(8 + 2 pt) (the
    // dropdown's measured title share, slicerH), tile ceil(1.6 pt) + 2 x 4 padding (written), 4 between
    const pills0 = pills(allVisuals(EN.dir)), szOf = (v) => parseFloat(String(S(P(v, 'value', 'default').fontSize)));
    const tit = (v) => ((v.visual.visualContainerObjects || {}).title || [{ properties: {} }])[0].properties;
    // (F2, changed on purpose: F1's sum was measured too low on Desktop 2.159, RECHECK-F1.md: 88 at 15pt cuts the text,
    // 140 draws it whole) the height measured to work, 140 at 15pt, scaled with the text size
    // (F3, changed on purpose: PILLS-F2.md on Desktop 2.159: 76 high at 8pt cuts the text, 88 at 9pt draws it whole: the
    // height has a floor, it does not shrink with the text) never below 88
    const need = (t) => Math.max(88, Math.ceil(140 * t / 15));
    chk(() => pills0.length === 2 && pills0.every((v) => parseFloat(String(S(tit(v).fontSize))) === szOf(v) && v.position.height >= need(szOf(v))
      && ['topMargin', 'bottomMargin'].every((m) => S(P(v, 'padding', 'default')[m]) === '4D')),
      () => `P6. each pill slicer: header at the tiles' text size, padding 4 written, high enough (${pills0.map((v) => `${v.position.height} >= ${need(szOf(v))} at ${szOf(v)}pt, title ${S(tit(v).fontSize)}`).join('; ')})`);
    // P6b (F2): in a stacked filter rail the layout gives each pill slicer the height measured for it at the slicer text
    // size (the strip above keeps its height and lowers the text instead); nothing overlaps; the reason said
    {
      const RL = await write({ name: 'Look Pills Rail', lang: 'en', layout: 'exec', filters: 'start', secondPage: false, planFields: FIELDS, slicerStyle: 'pills' });
      const rp = RL.dir && fs.existsSync(RL.dir) ? pills(allVisuals(RL.dir)) : [], all = RL.dir && fs.existsSync(RL.dir) ? allVisuals(RL.dir) : [];
      const sl = all.filter((v) => /^(slicer|advancedSlicerVisual)$/.test(v.visual.visualType)).sort((a, b) => a.position.y - b.position.y);
      const overlap = sl.some((v, i) => i && sl[i - 1].position.y + sl[i - 1].position.height > v.position.y);
      // (F3, changed on purpose: PILLS-F2.md, the laptop wrote this rail's pills 76 high at 8pt and Desktop cut their text)
      // a pill slicer the rail cannot give the measured height (88 at least) is a dropdown, and the answer says why; here
      // the rail holds three slicers at 15pt in 228, so both are dropdowns
      const why = /the slicer is \d+ high, the pills need \d+ at their smallest text/.test(JSON.stringify((RL.r && RL.r.slicerStyles) || RL.r || ''));
      chk(() => rp.every((v) => v.position.height >= need(szOf(v)) && parseFloat(String(S(tit(v).fontSize))) === szOf(v)) && (rp.length === 2 || (rp.length === 0 && why)) && !overlap,
        () => `P6b. the rail's pill slicers as high as measured, or dropdowns with why (pills ${rp.length}, why ${why}) (${rp.map((v) => `${v.position.height} >= ${need(szOf(v))} at ${szOf(v)}pt`).join('; ')}), no overlap: ${RL.err || short(RL.r).slice(0, 200)}`);
      const c = RL.r && !RL.r.err ? await check(RL.pbip) : null;
      chk(() => clean(c) && noBreak(c), () => `P6b. validator 0 errors, 0 "can break" on the rail report: ${valErr(c)}`);
    }
    const ents = (v, o) => ((v && v.visual.objects && v.visual.objects[o]) || []);
    chk(() => band && ents(band, 'value').length && ents(band, 'value').every((e) => e.selector) && S(P(band, 'value', 'default').show) === 'true' && P(band, 'value', 'default').fontSize && P(band, 'value', 'default').fontColor
      && ents(band, 'outline').every((e) => e.selector) && S(P(band, 'outline', 'default').show) === 'true',
      () => `P5. the pills' text (value) and outline only under their state selectors, show in the default: ${JSON.stringify(band && { value: ents(band, 'value'), outline: ents(band, 'outline') })}`);
    chk(() => band && !band.visual.query.sortDefinition, () => `P5. left to right: Power BI's own order (no sort written): ${JSON.stringify(band && band.visual.query.sortDefinition)}`);
    chk(() => band && band.mobile && JSON.stringify(band.mobile).includes('fontSize'), () => `P6. the phone layout gives the pills their phone text size: ${JSON.stringify(band && band.mobile)}`);
    chk(() => charts(vs).length >= 3 && charts(vs).every((v) => S(P(v, 'valueAxis').gridlineStyle) === 'dotted' && !!P(v, 'valueAxis').gridlineColor), () => `P7. every chart's value-axis gridlines dotted, in the quiet grey: ${JSON.stringify(charts(vs).map((v) => P(v, 'valueAxis')))}`);
    const ss = (EN.r && EN.r.j && EN.r.j.slicerStyle) || null;
    chk(() => ss && ss.asked === 'pills' && Array.isArray(ss.slicers) && ss.slicers.length === 3 && ss.slicers.every((x) => x.field && /^(pills|dropdown)$/.test(x.written) && /\S/.test(x.why || '')) && ss.slicers.find((x) => /Region/.test(x.field)).written === 'dropdown',
      () => `P8. the answer says each slicer's style with why: ${JSON.stringify(ss)}`);
    const H = unesc(EN.html || '');
    chk(() => /<td[^>]*>Slicer style<\/td><td[^>]*>[^<]*pills/i.test(H) && /<td[^>]*>Gridlines<\/td><td[^>]*>[^<]*dotted/i.test(H), () => `P9. the approval page names both options: ${(H.match(/Slicer style[\s\S]{0,200}/) || [''])[0]} ${(H.match(/Gridlines[\s\S]{0,200}/) || [''])[0]}`);
    const svg = (H.match(/<svg[\s\S]*?<\/svg>/g) || []).join('');
    chk(() => /class="pill"/.test(svg) && (svg.match(/class="pill"/g) || []).length >= 5, () => `P10. the preview draws the pills as rounded buttons (3 + 2): ${(svg.match(/class="pill"/g) || []).length}`);
    chk(() => /class="grid"[^>]*stroke-dasharray/.test(svg), () => 'P11. the preview draws the dotted gridlines');
    const c = EN.r && !EN.r.err ? await check(EN.pbip) : null;
    chk(() => clean(c), () => `P12. Microsoft's validator: 0 errors on the pills + dotted report: ${valErr(c)}`);
    chk(() => noBreak(c), () => `P13. check_report: 0 "can break": ${short(c)}`);
  }

  // ---------- PIN: pinned by the plan ----------
  {
    const pl = await w.call('plan_layout', { path: MP, lang: 'en', ...DES, planFields: FIELDS, name: 'Look Pinned', slicerStyle: 'pills', grid: 'dotted' });
    const id = pl.j && pl.j.plan && pl.j.plan.planId; if (id) await approve(id);
    for (const [k, v] of [['slicerStyle', 'dropdown'], ['grid', 'none']]) {
      const r = id ? await w.call('create_report', Object.assign({ path: MP, planId: id, lang: 'en', ...DES, design: pl.j.design, fields: FIELDS, name: 'Look Pinned', slicerStyle: 'pills', grid: 'dotted' }, { [k]: v })) : null;
      chk(() => r && r.err && !fs.existsSync(path.join(ROOT, 'g', 'Look Pinned.Report')), () => `PIN ${k}: another value than the plan's is refused and nothing is written: ${short(r || pl)}`);
    }
  }

  // ---------- N: grid none ----------
  {
    const N = await write({ name: 'Look None', lang: 'en', ...DES, planFields: FIELDS, grid: 'none' });
    const vs = N.dir && fs.existsSync(N.dir) ? allVisuals(N.dir) : [];
    chk(() => charts(vs).length >= 3 && charts(vs).every((v) => S(P(v, 'valueAxis').gridlineShow) === 'false') && dropdowns(vs).length === 3, () => `N1. grid none: no value-axis gridlines; slicers as default: ${N.err || short(N.r)} ${JSON.stringify(charts(vs).map((v) => P(v, 'valueAxis')))}`);
    const c = N.r && !N.r.err ? await check(N.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `N2. validator 0 errors, 0 "can break": ${valErr(c)}`);
  }

  // ---------- A: Arabic, right to left ----------
  {
    const A = await write({ name: 'Look Arabic', lang: 'ar', ...DES, planFields: FIELDS, displayNames: AR_NAMES, slicerStyle: 'pills', grid: 'dotted' });
    const vs = A.dir && fs.existsSync(A.dir) ? allVisuals(A.dir) : [], ps = pills(vs);
    const desc = (v) => { const s = ((v.visual.query.sortDefinition || {}).sort || [])[0]; return !!s && s.direction === 'Descending' && (s.field.Column || {}).Property === fieldOf(v); };
    chk(() => ps.length === 2 && ps.every(desc) && ps.every((v) => S(P(v, 'layout').rowCount) === '1L'), () => `A1. the Arabic pills read from the right (one row, sorted descending): ${A.err || short(A.r)} ${JSON.stringify(ps.map((v) => v.visual.query.sortDefinition))}`);
    chk(() => charts(vs).length >= 3 && charts(vs).every((v) => S(P(v, 'valueAxis').gridlineStyle) === 'dotted'), () => 'A2. the Arabic charts dotted');
    const c = A.r && !A.r.err ? await check(A.pbip) : null;
    chk(() => clean(c) && noBreak(c), () => `A3. validator 0 errors, 0 "can break" on the Arabic report: ${valErr(c)}`);
  }

  // ---------- TW: the Arabic twin of the English report ----------
  {
    const p0 = EN && EN.r && !EN.r.err ? await w.call('create_arabic_twin', { path: EN.pbip }) : null, id = p0 && p0.j && p0.j.plan && p0.j.plan.planId;
    if (id) await approve(id);
    const tw = id ? await w.call('create_arabic_twin', { path: EN.pbip, planId: id }) : null, twinDir = path.join(ROOT, 'g', 'Look Pills AR.Report');
    const vs = fs.existsSync(twinDir) ? allVisuals(twinDir) : [], ps = pills(vs);
    chk(() => ps.length === 2 && ps.every((v) => (((v.visual.query.sortDefinition || {}).sort || [])[0] || {}).direction === 'Descending'), () => `TW1. the twin keeps the pills, right to left: ${short(tw || p0)} ${JSON.stringify(ps.map((v) => v.visual.query.sortDefinition))}`);
    chk(() => charts(vs).length >= 3 && charts(vs).every((v) => S(P(v, 'valueAxis').gridlineStyle) === 'dotted'), () => 'TW2. the twin keeps the dotted grid');
    const twPbip = fs.existsSync(twinDir) ? 'g/Look Pills AR.pbip' : null, c = twPbip ? await check(twPbip) : null;
    chk(() => clean(c) && noBreak(c), () => `TW3. validator 0 errors, 0 "can break" on the twin: ${valErr(c)}`);
  }

  // ---------- MS: the Metric page's charts follow grid too (0.3.0 A1: they kept the theme's solid gridlines) ----------
  {
    for (const g of ['dotted', 'none']) {
      const M = await write({ name: 'Look Metric ' + g, lang: 'en', ...DES, planFields: FIELDS, grid: g, metricSwitcher: ['Sales[Total Sales]', 'Sales[Orders]'] });
      const ps = M.dir && fs.existsSync(M.dir) ? shownPages(M.dir) : [], mpg = ps.find((p) => p.visuals.some((v) => JSON.stringify(v.visual.query || {}).includes('fieldParameters')));
      const own = ps.filter((p) => p !== mpg).flatMap((p) => charts(p.visuals)), mc = mpg ? charts(mpg.visuals) : [];
      const ga = (v) => JSON.stringify(['gridlineShow', 'gridlineStyle', 'gridlineColor'].map((k) => P(v, 'valueAxis')[k] || null));
      chk(() => M.r && !M.r.err && mc.length === 2 && own.length && mc.every((v) => ga(v) === ga(own[0])) && (g === 'none' ? S(P(own[0], 'valueAxis').gridlineShow) === 'false' : S(P(own[0], 'valueAxis').gridlineStyle) === 'dotted'),
        () => `MS-1 ${g}. the Metric page's two charts have the gridlines of the report's other charts: ${M.err || short(M.r)} own ${own.length && ga(own[0])} metric ${JSON.stringify(mc.map(ga))}`);
      chk(() => M.r && M.r.j && M.r.j.grid && M.r.j.grid.charts === own.length + mc.length, () => `MS-2 ${g}. create_report's grid.charts counts the Metric page's charts (${own.length} + ${mc.length}): ${JSON.stringify(M.r && M.r.j && M.r.j.grid)}`);
      const c = M.r && !M.r.err ? await check(M.pbip) : null;
      chk(() => clean(c) && noBreak(c), () => `MS-3 ${g}. validator 0 errors and check_report 0 "can break": ${valErr(c)}`);
    }
  }
  // ---------- VAR (F1): the variants report for the laptop (mcp/lab/pills-variants.mjs) ----------
  {
    const { writeVariants } = await import('./lab/pills-variants.mjs');
    const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pv-'));
    let r = null; try { r = await writeVariants(out); } catch (e) { r = { error: String(e && e.message || e) }; }
    const PD = r && r.pageId ? path.join(out, 'pills/Pills Variants.Report/definition/pages', r.pageId) : '';
    const vs = PD && fs.existsSync(path.join(PD, 'visuals')) ? fs.readdirSync(path.join(PD, 'visuals')).map((v) => rd(path.join(PD, 'visuals', v, 'visual.json'))) : [];
    const pl = vs.filter((v) => v.visual.visualType === 'advancedSlicerVisual'), lb = vs.filter((v) => v.visual.visualType === 'textbox');
    const v0 = pl.find((v) => v.name === 'pillv0'), v2 = pl.find((v) => v.name === 'pillv2'), shipped = EN && EN.dir ? allVisuals(EN.dir).find((v) => v.visual.visualType === 'advancedSlicerVisual') : null;
    // (F2, the laptop's recheck: the project must open in Desktop) definition.pbism, a V3 model with a culture, no slicer in
    // a group the page lacks; the shipped shape at 15pt at 140, 130 and 120
    const SM = path.join(out, 'pills/Shop.SemanticModel'), bim = fs.existsSync(path.join(SM, 'model.bim')) ? rd(path.join(SM, 'model.bim')) : {};
    const hOf = (n) => (pl.find((v) => v.name === n) || { position: {} }).position.height;
    chk(() => fs.existsSync(path.join(SM, 'definition.pbism')) && rd(path.join(SM, 'definition.pbism')).version === '1.0' && bim.model.defaultPowerBIDataSourceVersion === 'powerBI_V3' && bim.model.culture
      && pl.every((v) => !v.parentGroupName) && hOf('pillv0') === 140 && hOf('pillv0130') === 130 && hOf('pillv0120') === 120,
      () => `VAR-2. the variants project opens in Desktop (pbism, V3 and culture, no stray group) and holds the shipped shape at 140, 130, 120: ${JSON.stringify(pl.map((v) => [v.name, v.position.height, v.parentGroupName || null]))}`);
    chk(() => r && r.check && r.check.validator === 0 && r.check.canBreak === 0 && pl.length === 6 && lb.length === 6 && /V0 \(shipped\)/.test(JSON.stringify(lb))
      && Object.values(v2.visual.objects).every((es) => es.length === 1 && !es[0].selector) && shipped && JSON.stringify(Object.keys(v0.visual.objects).sort()) === JSON.stringify(Object.keys(shipped.visual.objects).sort()) && v0.visual.objects.padding && v0.visual.visualContainerObjects.title[0].properties.fontSize
      && !pl.find((v) => v.name === 'pillv1').visual.objects.padding && !pl.find((v) => v.name === 'pillv1').visual.visualContainerObjects.title[0].properties.fontSize,
      () => `VAR. one page, six labelled pill slicers (V0 the shipped shape at 140, 130, 120; V1 its text only, V2 no selectors, V3 with room), validator 0 and 0 "can break": ${JSON.stringify(r).slice(0, 400)} ${pl.length} pills, ${lb.length} labels`);
    fs.rmSync(out, { recursive: true, force: true });
  }

  // ---------- SEL: the pills' entries both ways ----------
  {
    const src = EN && EN.dir;
    if (src && fs.existsSync(src)) {
      const dst = path.join(ROOT, 'g', 'Look NoSel.Report');
      fs.cpSync(src, dst, { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'g', 'Look NoSel.pbip'), fs.readFileSync(path.join(ROOT, 'g', 'Look Pills.pbip'), 'utf8').replace(/Look Pills\.Report/g, 'Look NoSel.Report'));
      // every state-keyed entry of the pills merged into the one entry with no selector (the selected look dropped)
      let n = 0;
      for (const p of shownPages(dst)) for (const v of p.visuals) if (v.visual.visualType === 'advancedSlicerVisual') {
        const f = path.join(dst, 'definition/pages', p.id, 'visuals', v.name, 'visual.json'), j = rd(f);
        Object.keys(j.visual.objects).forEach((o) => { const es = j.visual.objects[o]; j.visual.objects[o] = [{ properties: Object.assign({}, ...es.filter((e) => !e.selector || e.selector.id === 'default').map((e) => e.properties)) }]; });
        fs.writeFileSync(f, JSON.stringify(j, null, 2)); n++;
      }
      const c = await check('g/Look NoSel.pbip');
      chk(() => n === 2 && clean(c), () => `SEL. the pills without selectors: validator 0 errors too (${n} rewritten): ${valErr(c)}`);
    } else chk(() => false, () => 'SEL. no English pills report to vary');
  }
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { console.log(`FAIL  look-options  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  look-options  ${checks} checks`);
