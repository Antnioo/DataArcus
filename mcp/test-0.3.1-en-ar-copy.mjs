// 0.3.1 R1 (the owner, 25 Oct: "fix the things I saw myself in the MCP"; written red first): a real user's first report
// through create_arabic_twin into "same" (23 Oct; its shape only, nothing of its data) showed seven things wrong in Power
// BI Desktop. The fixture is made up in that shape: mcp/test-models/service-orders (facility maintenance work orders;
// its English report written once by make-report.mjs: the user's own light theme with every visual on a white panel, no
// page buttons, title and subtitle as text boxes, a matrix and a table at 14pt with the values set to wrap).
//   S0  set-up: the plan of the EN-AR copy has 2 page pairs and 4 language buttons, all placed
//   1   the language buttons (no page tabs to copy: the plain button): a text colour, readable on the page behind it,
//       the container's background, border and shadow off, the outline in a colour
//   2   each Arabic page's Tab stops in right-to-left reading order (the copy and the separate twin); the English pages'
//       with the language button in their reading order
//   3   an Arabic title that needs more room than the English box is widened (one line), inside the page, over nothing
//   4   the Arabic pages' text boxes with text keep the panel the English pages keep (TW1: the twin identical); the English pages are the original's;
//       create_report's own header title has the panel off (a guard)
//   5   check_report says it when a table or matrix shows fewer rows than at Power BI's label size, or its values wrap;
//       nothing for a table DataArcus wrote; the twin changes no text size or word wrap
//   6   a field shown only in a table of items is one row's value: said in the plan, and its draft leaves "Avg" out; the
//       same kind of field on a card keeps its average
//   7   the matrix: the plan, the write and the approval page say plainly that Power BI's matrix has no right-to-left
//       setting, and what the person can do; nothing faked
//   V   Microsoft's validator: 0 errors on the written copy
//   node test-0.3.1-en-ar-copy.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), require = createRequire(import.meta.url);
const Rules = require('../assets/js/report-rules.js'), A11y = require('../assets/js/report-a11y.js'), Engine = require('../assets/js/design-engine.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const req = (url, method, body) => new Promise((resolve) => {
  const u = new URL(url), r = http.request(u, { method, headers: Object.assign({ Host: u.host }, body ? { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); });
  r.on('error', () => resolve('')); if (body) r.write(body); r.end();
});
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '').replace(/''/g, "'") : null);
const short = (x) => (x && x.err ? String(x.t).slice(0, 300) : JSON.stringify(x && x.j).slice(0, 300));
const over = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
const holds = (a, b) => a.x <= b.x + 0.5 && a.x + a.width >= b.x + b.width - 0.5 && a.y <= b.y + 0.5 && a.y + a.height >= b.y + b.height - 0.5;
const typeOf = (v) => (v.visual ? v.visual.visualType : v.visualGroup ? 'group' : '');
const off = (vco, k) => Array.isArray((vco || {})[k]) && vco[k].some((e) => e && !e.selector && e.properties && lit(e.properties.show) === 'false');
const textOfBox = (v) => (((((v.visual || {}).objects || {}).general || [])[0] || { properties: {} }).properties.paragraphs || []).map((p) => (p.textRuns || []).map((r) => r.value || '').join('')).join(' ');

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-r1-')));
fs.cpSync(path.join(HERE, 'test-models/service-orders'), path.join(ROOT, 'so'), { recursive: true, filter: (f) => !/make-report\.mjs$/.test(f) });
const PBIP = 'so/Service Orders.pbip', ORIG = path.join(ROOT, 'so/Service Orders.Report'), COPY = path.join(ROOT, 'so/Service Orders (EN-AR).Report'), TWIN = path.join(ROOT, 'so/Service Orders AR.Report');
const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
const w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
// approve a plan in its window, as the person does; the page's text is returned
const approve = async (pid) => { const n = links().length; await w.call('approve_plan', { planId: pid }); const url = await linkAt(n), html = url ? unesc(await req(url, 'GET')) : '';
  if (url) { await req(url, 'POST', 'decision=approve'); await w.call('approve_plan', { planId: pid }); } return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '); };
const pagesOf = (dir) => (fs.existsSync(dir) ? rd(path.join(dir, 'definition/pages/pages.json')).pageOrder : []);
const pageJ = (dir, pid) => rd(path.join(dir, 'definition/pages', pid, 'page.json'));
const visualsOf = (dir, pid) => { const d = path.join(dir, 'definition/pages', pid, 'visuals'); return fs.existsSync(d) ? fs.readdirSync(d).map((n) => rd(path.join(d, n, 'visual.json'))) : []; };
const theme = rd(path.join(ORIG, 'StaticResources/RegisteredResources/service-theme.json'));
// a page's Tab stop pairs met against its reading order, per group (check_report's own count, A11Y_TAB_ORDER)
const tabPairs = (vs, dir) => { const g = {}; vs.filter((v) => v.position && v.position.tabOrder != null).forEach((v) => { (g[v.parentGroupName || ''] = g[v.parentGroupName || ''] || []).push(v); });
  return Object.values(g).reduce((n, list) => n + A11y.inversions(list.slice().sort((a, b) => a.position.tabOrder - b.position.tabOrder).map((v) => ({ x: v.position.x, y: v.position.y, w: v.position.width, h: v.position.height })), dir), 0); };

// the approved texts: the fixed list's draft, else a made-up Arabic text; the title the Arabic of 45 characters
const TITLE_AR = 'أوامر العمل المفتوحة حسب القسم والحالة', LONG_AR = 'أوامر العمل المفتوحة حسب القسم والفني والحالة';
try {
  const p0 = await w.call('create_arabic_twin', { path: PBIP, into: 'same' }), T0 = (p0.j && p0.j.texts) || [];
  let k = 0; const L = {}; T0.filter((t) => t.text != null).forEach((t) => { L[t.id] = t.draftArabic || `نص ${++k}`; });
  L['textbox:overview0001/ovTitle/0.0'] = TITLE_AR; L['textbox:detail000002/dtTitle/0.0'] = LONG_AR; L['field:Work Orders.Avg days open'] = 'أيام الفتح'; L['field:Work Orders.Avg Cost'] = 'التكلفة';
  const p1 = await w.call('create_arabic_twin', { path: PBIP, into: 'same', labels: L }), J = p1.j || {}, LG = J.languages || {};
  const B = Array.isArray(LG.buttons) ? LG.buttons : [];
  chk(() => !p1.err && TITLE_AR.length === 38 && LONG_AR.length === 45 && (LG.pairs || []).length === 2 && B.length === 4 && B.every((b) => b.placed), () => `S0. the copy's plan: 2 page pairs and 4 language buttons, all placed: ${short(p1)}`);

  // ---------- 6: a table row's value (the plan's texts) ----------
  const text = (id) => (J.texts || []).find((t) => t.id === id) || {};
  chk(() => /one row/i.test(String(text('field:Work Orders.Avg days open').what || '')), () => `D1. the table-only field "Avg days open" says it shows one row's value: ${JSON.stringify(text('field:Work Orders.Avg days open'))}`);
  chk(() => text('field:Work Orders.Avg Cost').draftArabic && !/متوسط/.test(text('field:Work Orders.Avg Cost').draftArabic), () => `D2. a table-only "Avg ..." field's draft leaves the average out: ${JSON.stringify(text('field:Work Orders.Avg Cost'))}`);
  chk(() => /متوسط/.test(String(text('field:Work Orders.Average Cost').draftArabic || '')) && !/one row/i.test(String(text('field:Work Orders.Average Cost').what || '')), () => `D3. the same kind of field on a card and a matrix keeps its average: ${JSON.stringify(text('field:Work Orders.Average Cost'))}`);

  // ---------- 7: the matrix, said plainly (plan, approval page, write) ----------
  const MX = /matrix has no right-to-left setting/i, MXDO = /table or a chart/i;
  const mline = (x) => ((x && x.cannot) || []).find((c) => MX.test(String(c.why || '') + ' ' + String(c.what || '')));
  chk(() => mline(J) && MXDO.test(mline(J).why), () => `M1a. the plan's cannot says the matrix has no right-to-left setting, and what to do: ${JSON.stringify((J.cannot || []).filter((c) => /matri/i.test(c.what)))}`);
  const page = await approve(J.plan && J.plan.planId);
  chk(() => MX.test(page) && MXDO.test(page), () => `M2. the approval page says it: ${(page.match(/.{0,80}atri.{0,200}/) || [page.slice(0, 200)])[0]}`);
  const wr = await w.call('create_arabic_twin', { path: PBIP, into: 'same', planId: J.plan && J.plan.planId });
  chk(() => !wr.err && wr.j.written === true && fs.existsSync(COPY), () => `S0b. the copy is written: ${short(wr)}`);
  chk(() => mline(wr.j) && MXDO.test(mline(wr.j).why), () => `M1b. the write's cannot says it too: ${JSON.stringify(((wr.j || {}).cannot || []).filter((c) => /matri/i.test(c.what)))}`);

  const ORD = pagesOf(ORIG), CO = pagesOf(COPY), EN = CO.slice(0, 2), AR = CO.slice(2);
  const page0 = theme.visualStyles.page['*'].background[0].color.solid.color;
  // ---------- 1: the language buttons ----------
  const isLang = (v) => typeOf(v) === 'actionButton' && /PageNavigation/.test(String(lit(((v.visual.visualContainerObjects.visualLink || [])[0] || { properties: {} }).properties.type)));
  const btns = CO.flatMap((p) => visualsOf(COPY, p).filter(isLang).map((v) => ({ p, v })));
  const defOf = (v, card) => ((v.visual.objects[card] || []).find((e) => e.selector && e.selector.id === 'default') || { properties: {} }).properties;
  const colourOf = (p) => (p && p.solid && p.solid.color ? lit(p.solid.color) : null);
  chk(() => btns.length === 4 && btns.every((b) => colourOf(defOf(b.v, 'text').fontColor)), () => `B1. each language button sets its text colour (default selector): ${JSON.stringify(btns.map((b) => defOf(b.v, 'text')))}`);
  chk(() => btns.every((b) => Engine.contrast(colourOf(defOf(b.v, 'text').fontColor), page0) >= 4.5), () => `B2. at 4.5:1 or more against the page behind it (${page0}): ${JSON.stringify(btns.map((b) => colourOf(defOf(b.v, 'text').fontColor)))}`);
  chk(() => btns.every((b) => ['background', 'border', 'dropShadow'].every((k) => off(b.v.visual.visualContainerObjects, k))), () => `B3. its container's background, border and shadow are off: ${JSON.stringify(btns.map((b) => Object.keys(b.v.visual.visualContainerObjects)))}`);
  chk(() => btns.every((b) => colourOf(defOf(b.v, 'outline').lineColor)), () => `B4. its outline has a colour: ${JSON.stringify(btns.map((b) => b.v.visual.objects.outline))}`);

  // ---------- 2: the tab order ----------
  const arPairs = AR.map((p) => tabPairs(visualsOf(COPY, p), 'rtl')), enPairs = EN.map((p) => tabPairs(visualsOf(COPY, p), 'ltr'));
  chk(() => AR.length === 2 && arPairs.every((n) => n === 0), () => `T1a. each Arabic page of the copy has its Tab stops in right-to-left reading order: pairs ${JSON.stringify(arPairs)}`);
  chk(() => enPairs.every((n) => n === 0), () => `T2. each English page of the copy, its language button in, in left-to-right reading order: pairs ${JSON.stringify(enPairs)}`);
  const nums = (vs) => vs.filter((v) => v.position.tabOrder != null && !isLang(v)).map((v) => v.position.tabOrder).sort((a, b) => a - b).join();
  chk(() => ORD.every((p, i) => nums(visualsOf(COPY, AR[i])) === nums(visualsOf(ORIG, p))), () => 'T3. the Arabic pages keep the English page\'s set of Tab numbers');

  // ---------- 3: the Arabic title fits ----------
  const arV = AR.flatMap((p) => visualsOf(COPY, p)), arBoxes = arV.filter((v) => typeOf(v) === 'textbox' && textOfBox(v).trim());
  const need = (v) => { const runs = v.visual.objects.general[0].properties.paragraphs.flatMap((p) => p.textRuns), t = Math.max(...runs.map((r) => parseFloat(r.textStyle.fontSize))), len = runs.reduce((a, r) => a + r.value.length, 0);
    const lines = Math.max(1, Math.ceil(len * Rules.MEASURED.CH(t) / Math.max(1, v.position.width - 10))); return { lines, h: Rules.MEASURED.BOX(t, lines) }; };
  const cut = ((J.fitted || {}).textboxesCut || []), long = visualsOf(COPY, AR[1]).find((v) => textOfBox(v) === LONG_AR);
  chk(() => arBoxes.length === 4 && arBoxes.every((v) => (long && v.name === long.name) || v.position.height + 0.5 >= need(v).h), () => `F1. every Arabic text box but the one said in textboxesCut holds its lines (TEXTBOX_FITS): ${JSON.stringify(arBoxes.map((v) => [v.name, v.position.width, v.position.height, need(v)]))}`);
  chk(() => long && cut.length === 1 && cut[0].visual === 'dtTitle' && cut[0].page === 'detail000002' && /shorter Arabic text/.test(cut[0].why) && !visualsOf(COPY, AR[1]).some((v) => v.name !== long.name && v.position && over(v.position, long.position) && !holds(v.position, long.position)),
    () => `F3. a text box whose Arabic can't fit beside and under it is said (textboxesCut) and laid over nothing: ${JSON.stringify(cut)} ${JSON.stringify(long && long.position)}`);
  { const t = visualsOf(COPY, AR[0]).find((v) => textOfBox(v) === TITLE_AR), others = visualsOf(COPY, AR[0]).filter((v) => v !== t && v.position);
    chk(() => t && need(t).lines === 1 && t.position.x >= 0 && t.position.x + t.position.width <= 1280 && !others.some((v) => over(v.position, t.position) && !holds(v.position, t.position)),
      () => `F2. the Arabic title is on one line, inside the page, over no visual: ${JSON.stringify(t && t.position)}`); }

  // ---------- 4: text boxes are not panels ----------
  // (TW1, M1-S1: the owner, 27 Oct, "i want the twin to be identical": the Arabic pages' text boxes keep the panel the
  // English pages' have; this check said "off" before, R1's item 4)
  const enBoxes = EN.flatMap((p) => visualsOf(COPY, p)).filter((v) => typeOf(v) === 'textbox' && textOfBox(v).trim()), panelOf = (v) => JSON.stringify(['background', 'border', 'dropShadow'].map((k) => (v.visual.visualContainerObjects || {})[k] || null));
  chk(() => arBoxes.length === 4 && enBoxes.length === 4 && arBoxes.every((v) => !['background', 'border', 'dropShadow'].some((k) => off(v.visual.visualContainerObjects, k))) && new Set(arBoxes.concat(enBoxes).map(panelOf)).size === 1,
    () => `X1. the Arabic pages' text boxes with text keep the panel their English pages' keep (the twin identical): ${JSON.stringify(arBoxes.concat(enBoxes).map((v) => [v.name, panelOf(v)]))}`);
  chk(() => ORD.every((p, i) => visualsOf(ORIG, p).filter((v) => typeOf(v) === 'textbox').every((v) => JSON.stringify(visualsOf(COPY, EN[i]).find((x) => x.name === v.name)) === JSON.stringify(v))), () => 'X2. the English pages\' text boxes are the original\'s');

  // ---------- 5: tables and matrices ----------
  const look = (v) => JSON.stringify(['values', 'columnHeaders', 'rowHeaders', 'total'].map((k) => ((v.visual.objects || {})[k] || []).map((e) => [lit((e.properties || {}).fontSize), lit((e.properties || {}).wordWrap)])));
  chk(() => ORD.every((p, i) => visualsOf(ORIG, p).filter((v) => /^(tableEx|pivotTable)$/.test(typeOf(v))).every((v) => { const a = visualsOf(COPY, AR[i]).find((x) => typeOf(x) === typeOf(v)); return a && look(a) === look(v); })),
    () => 'Y2. the twin changes no table or matrix text size or word wrap');
  const ck = await w.call('check_report', { path: PBIP }), rows = ((ck.j || {}).findings || []).filter((f) => f.rule === 'TABLE_ROWS_SHOWN');
  chk(() => rows.length === 2 && ['tableEx', 'pivotTable'].every((t) => rows.some((f) => f.visual && f.visual.type === t && /\d+pt/.test(f.fix) && /word wrap off/i.test(f.fix))),
    () => `Y1a. check_report: one TABLE_ROWS_SHOWN note for the table and one for the matrix, each with a size and "Word wrap off": ${JSON.stringify(rows).slice(0, 600)} ${short(ck)}`);
  // ---------- M3: the matrix is not faked ----------
  { const mo = visualsOf(ORIG, ORD[0]).find((v) => typeOf(v) === 'pivotTable'), ma = visualsOf(COPY, AR[0]).find((v) => typeOf(v) === 'pivotTable'), qs = (v) => JSON.stringify(['Rows', 'Columns'].map((r) => v.visual.query.queryState[r].projections.map((x) => [x.queryRef, x.field])));
    chk(() => mo && ma && qs(mo) === qs(ma) && !ma.visual.query.sortDefinition, () => 'M3. the Arabic matrix keeps its row and column fields as they are (nothing faked)'); }
  // ---------- V: Microsoft's validator ----------
  const cc = await w.call('check_report', { path: 'so/Service Orders (EN-AR).pbip', checks: ['validator'] });
  chk(() => !cc.err && cc.j.validator && cc.j.validator.ran && cc.j.validator.errors === 0, () => `V. Microsoft's validator: 0 errors on the copy: ${JSON.stringify(cc.j && cc.j.validator)}`);

  // ---------- 2 (the separate twin) ----------
  const ps = await w.call('create_arabic_twin', { path: PBIP, labels: L }), sid = ps.j && ps.j.plan && ps.j.plan.planId;
  if (sid) await approve(sid);
  const ws = sid ? await w.call('create_arabic_twin', { path: PBIP, planId: sid }) : { err: true, t: 'no plan' };
  const twPairs = pagesOf(TWIN).map((p) => tabPairs(visualsOf(TWIN, p), 'rtl'));
  chk(() => !ws.err && twPairs.length === 2 && twPairs.every((n) => n === 0), () => `T1b. each page of the separate twin has its Tab stops in right-to-left reading order: pairs ${JSON.stringify(twPairs)} ${short(ws)}`);

  // ---------- 4 and 5 on a report DataArcus writes (guards) ----------
  const pl = await w.call('plan_layout', { path: 'so/Service Orders.SemanticModel', lang: 'en', layout: 'exec', name: 'DA Orders' }), id0 = pl.j && pl.j.plan && pl.j.plan.planId;
  if (id0) await approve(id0);
  const cr = id0 ? await w.call('create_report', { path: 'so/Service Orders.SemanticModel', lang: 'en', name: 'DA Orders', planId: id0, design: pl.j.design }) : { err: true, t: 'no plan: ' + short(pl) };
  const DA = path.join(ROOT, 'so/DA Orders.Report'), daV = pagesOf(DA).filter((p) => pageJ(DA, p).type !== 'Tooltip').flatMap((p) => visualsOf(DA, p));
  const titleBox = daV.find((v) => typeOf(v) === 'textbox' && /DA Orders/.test(textOfBox(v)));
  chk(() => !cr.err && titleBox && ['background', 'border', 'dropShadow'].every((k) => off(titleBox.visual.visualContainerObjects, k)), () => `X3. create_report's header title has the theme's panel off: ${short(cr)} ${JSON.stringify(titleBox && titleBox.visual.visualContainerObjects)}`);
  const cd = await w.call('check_report', { path: 'so/DA Orders.pbip' });
  chk(() => !cd.err && daV.some((v) => /^(tableEx|pivotTable)$/.test(typeOf(v))) && !((cd.j || {}).findings || []).some((f) => f.rule === 'TABLE_ROWS_SHOWN'), () => `Y1b. no TABLE_ROWS_SHOWN for the tables DataArcus writes: ${JSON.stringify(((cd.j || {}).findings || []).filter((f) => f.rule === 'TABLE_ROWS_SHOWN')).slice(0, 400)} ${short(cd)}`);
} finally {
  await w.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
}

if (problems.length) { problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  test-0.3.1-en-ar-copy  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  test-0.3.1-en-ar-copy  ${checks} checks`);
