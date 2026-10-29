// rc.24: the gaps the laptop's Desktop release proof of rc.23 found (18 Oct 2026, Power BI Desktop 2.159), each written red
// first. They finish what 0.2.9 already approved (B-140, the Arabic twin B-137/B-138); nothing else changes.
//   B-140: the approval page names each chart field by the kind it is written as, with the reason when it changed
//          ("Bar chart by Plan Groups[Plan Group Name] (planned as a column chart: ...)"), never "Column chart by"
//   T-1:   the twin offers the visible texts of the report's title measures ("Chart title (from a title measure)") and
//          writes its own Arabic title measures, used by its visuals only; a title measure whose DAX builds the text
//          another way is listed as not translated, with why; the original report and the model are never changed
//   T-2:   the twin widens each button to its Arabic text (check_report's own measurement), within its page or group,
//          without overlapping its neighbours; what can't fit is said in the plan
//   T-3:   the twin's KPI cards (one value) have their value right-aligned, under their right-aligned titles
//   T-4:   a table column whose Arabic header is wider than its column is widened within the table's width (text
//          columns give up width down to their own need; numbers are never narrowed), or said in the plan
//   node test-rc24.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const require = createRequire(import.meta.url);
const { textWidth } = require('../assets/js/text-measure.js');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const get = (url) => new Promise((resolve) => { http.get(url, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }).on('error', () => resolve('')); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const lit = (p) => (p && p.expr && p.expr.Literal ? String(p.expr.Literal.Value).replace(/^'|'$/g, '') : undefined);

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rc24-'));
const cp = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
cp('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
// the model of rc.22's B-140 case: a column chart by a many-valued lookup name is written as a bar chart
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
fs.mkdirSync(path.join(ROOT, 'plans/Plans.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'plans/Plans.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'GroupKey', dataType: 'int64', sourceColumn: 'GroupKey' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Plan Groups', partitions: mp('Plan Groups'), columns: [{ name: 'GroupKey', dataType: 'int64', sourceColumn: 'GroupKey' }, { name: 'Plan Group Name', dataType: 'string', sourceColumn: 'Plan Group Name' }] },
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date', isKey: true }, { name: 'Month Name', dataType: 'string', sourceColumn: 'Month Name' }] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'GroupKey', toTable: 'Plan Groups', toColumn: 'GroupKey' }, { name: 'r2', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
// two servers: one whose browser clicks Approve, one whose browser only notes the link (to read the approval page)
const s = await serverClient(ROOT, {}), w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const pageOf = async (srv, id) => { const n = links().length; await srv.call('approve_plan', { planId: id }); return get(await linkAt(n)); };
const pagesOf = (rep) => { const dir = path.join(ROOT, rep, 'definition/pages'), order = rd(path.join(dir, 'pages.json')).pageOrder;
  return order.map((id) => ({ id, page: rd(path.join(dir, id, 'page.json')), visuals: fs.existsSync(path.join(dir, id, 'visuals')) ? fs.readdirSync(path.join(dir, id, 'visuals')).map((v) => rd(path.join(dir, id, 'visuals', v, 'visual.json'))) : [] })); };
const snapshot = (dir) => Object.fromEntries(tree(dir).map((f) => [path.relative(dir, f), fs.readFileSync(f).toString('base64')]));

try {
  // ---------- B-140: the approval page names the written kind ----------
  {
    const pl = await w.call('plan_layout', { path: 'plans', name: 'Kinds', layout: 'exec', secondPage: false, planFields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], category: 'Sales[Region]', category2: 'Plan Groups[Plan Group Name]' } });
    chk(() => !pl.err && pl.j.kindChanges && pl.j.kindChanges.slots.some((x) => x.layout === 'column' && x.written === 'bar'), () => `B-140 setup. plan_layout writes the column chart as a bar chart: ${short(pl)}`);
    const page = await pageOf(w, pl.j.plan.planId);
    const fields = (/<h2>Fields[\s\S]*?<\/table>/.exec(page) || [''])[0];
    chk(() => !/Column chart by/.test(fields), () => `B-140. the approval page's field rows never say "Column chart by" for a chart written as a bar chart: ${fields.slice(0, 600)}`);
    chk(() => /Bar chart by<\/td><td[^>]*>Plan Groups\[Plan Group Name\] \(planned as a column chart: [^<]+\)/.test(fields), () => `B-140. the row says "Bar chart by Plan Groups[Plan Group Name] (planned as a column chart: why)": ${fields.slice(0, 600)}`);
    chk(() => /Bar chart by<\/td><td[^>]*>Sales\[Region\]</.test(fields), () => `B-140. the bar chart planned as a bar chart says no reason: ${fields.slice(0, 600)}`);
    // without fields of its own the layout section says which visual is written as another kind
    const pl2 = await w.call('plan_layout', { path: 'large', focus: 'Web Orders', name: 'Kinds 2', layout: 'exec', secondPage: false });
    const changed = !pl2.err && pl2.j.kindChanges ? pl2.j.kindChanges.slots : [];
    const page2 = await pageOf(w, pl2.j.plan.planId);
    chk(() => changed.every((x) => new RegExp(`${x.role}: [A-Za-z]+ chart \\(planned as a ${x.layout === 'column' ? 'column' : x.layout === 'bar' ? 'bar' : x.layout} chart`).test(page2)), () => `B-140. every kind change is on the approval page (${JSON.stringify(changed)}): ${(/<h2>Layout[\s\S]*?<\/table>/.exec(page2) || [''])[0].slice(0, 600)}`);
  }

  // ---------- the golden report (large synthetic model, focus Web Orders), and its twin ----------
  const pl = await s.call('plan_layout', { path: 'large', focus: 'Web Orders', name: 'Golden', layout: 'exec' });
  await s.call('approve_plan', { planId: pl.j.plan.planId });
  const made = await s.call('create_report', { path: 'large', focus: 'Web Orders', name: 'Golden', planId: pl.j.plan.planId, design: pl.j.design });
  chk(() => !made.err, () => `setup. the golden report is written: ${short(made)}`);
  const ORIG = path.join(ROOT, 'large/Golden.Report'), MODEL = path.join(ROOT, 'large/Large Synthetic.SemanticModel');
  // a copy of it with one title measure whose DAX builds its text from a value of the model (never guessed)
  fs.cpSync(ORIG, path.join(ROOT, 'large/Dyn.Report'), { recursive: true });
  {
    const f = path.join(ROOT, 'large/Dyn.Report/definition/reportExtensions.json'), ext = rd(f);
    const e = ext.entities.find((x) => x.name === 'Coupon');
    e.measures.push({ name: 'Title: Region now', dataType: 'Text', expression: '"Region: " & SELECTEDVALUE ( \'Coupon\'[Coupon Region], "all" )' });
    fs.writeFileSync(f, JSON.stringify(ext, null, 2));
    const pages = path.join(ROOT, 'large/Dyn.Report/definition/pages');
    const vf = tree(pages).find((x) => /visual\.json$/.test(x) && /"Title: Web Orders Total Score by Coupon Region"/.test(fs.readFileSync(x, 'utf8')));
    fs.writeFileSync(vf, fs.readFileSync(vf, 'utf8').split('"Title: Web Orders Total Score by Coupon Region"').join('"Title: Region now"'));
  }
  const before = snapshot(ORIG), modelBefore = snapshot(MODEL);
  const p0 = await s.call('create_arabic_twin', { path: 'large/Golden.Report' });
  chk(() => !p0.err, () => `setup. the twin's plan: ${short(p0)}`);
  const texts = (p0.j && p0.j.texts) || [];
  const tm = texts.filter((t) => t.kind === 'titleMeasure');

  // ---------- T-1: title measures ----------
  chk(() => tm.some((t) => t.text === 'Web Orders Total Score by Coupon Region') && tm.some((t) => t.text === 'Top {1} of {2}: Web Orders Total Score by Coupon Region') && tm.some((t) => t.text === 'Web Orders Total Score by Plan Group'),
    () => `T-1. the plan offers each title measure's visible texts (the plain title, and "Top {1} of {2}: ..."): ${JSON.stringify(tm)}`);
  chk(() => tm.every((t) => /title measure/i.test(t.what || '') && Array.isArray(t.measures) && t.measures.length >= 1), () => `T-1. each is named "Chart title (from a title measure)", with its measures: ${JSON.stringify(tm.slice(0, 3))}`);
  // the labels: every text in Arabic (the page buttons, the Reset button as the laptop's tester wrote it, long headers)
  const AR = { 'Executive summary': 'الملخص التنفيذي', Details: 'التفاصيل', Tooltip: 'تلميح', 'Reset filters': 'إعادة ضبط عوامل التصفية', 'Web Orders Total Score': 'مجموع نقاط طلبات الويب الإجمالي', 'Web Orders Total Value': 'القيمة الإجمالية لطلبات الويب', 'Web Orders Count': 'عدد طلبات الويب', 'Plan Group': 'مجموعة الخطة' };
  const arOf = (t) => { const x = String(t.text || '').trim();
    if (t.kind === 'titleMeasure') return /^Top \{1\} of \{2\}: /.test(x) ? 'أعلى {1} من {2}: ' + (/Coupon/.test(x) ? 'النقاط حسب منطقة القسيمة' : 'النقاط حسب مجموعة الخطة') : /Coupon/.test(x) ? 'النقاط حسب منطقة القسيمة' : 'النقاط حسب مجموعة الخطة';
    return AR[x] || t.draftArabic || AR[x.replace(/ · .*$/, '')] || 'نص'; };
  const labels = Object.fromEntries(texts.filter((t) => t.text != null).map((t) => [t.id, arOf(t)]));
  const p1 = await w.call('create_arabic_twin', { path: 'large/Golden.Report', labels });
  chk(() => !p1.err && p1.j.labels.given === Object.keys(labels).length && !(p1.j.labels.problems || []).length, () => `T-1. every label is taken: ${short(p1)}`);
  const page = await pageOf(w, p1.j.plan.planId);
  // (0.3.0 T2, changed on purpose: on the Arabic twin's page a quoted name is isolated, <bdi>"..."</bdi>)
  // (FX1: the twin's page wholly Arabic; changed on purpose from "Chart title (from a title measure)")
  chk(() => /عنوان مخطط \(من مقياس عنوان\) (?:<bdi>)?«Top \{1\} of \{2\}: Web Orders Total Score by Coupon Region»/.test(page) && /أعلى \{1\} من \{2\}: النقاط حسب منطقة القسيمة/.test(page), () => `T-1. the approval page names the title measure's text: ${(/النصوص العربية[\s\S]{0,800}/.exec(page) || [''])[0]}`);
  // a label that drops a number the report counts is refused, never written half
  {
    const bad = Object.assign({}, labels); const k = (tm.find((t) => /\{2\}/.test(t.text)) || { id: 'titleText:none' }).id; bad[k] = 'أعلى {1}: النقاط';
    const pb = await s.call('create_arabic_twin', { path: 'large/Golden.Report', labels: bad });
    chk(() => !pb.err && (pb.j.labels.problems || []).some((x) => x.id === k && /\{2\}/.test(x.why)) && !(pb.j.texts.find((t) => t.id === k) || {}).label, () => `T-1. a label without {2} is listed in labels.problems and not taken: ${pb.err ? pb.t : JSON.stringify(pb.j.labels)}`);
  }
  // (T-2) a button text too long for any room: the plan says it (asked before the twin exists: a plan needs the name free)
  const longer = Object.assign({}, labels), reset = texts.find((t) => t.kind === 'button' && /Reset/.test(t.text || '')) || { id: 'button:none' };
  longer[reset.id] = 'إعادة ضبط جميع عوامل التصفية في هذه الصفحة الآن';
  const pc = await s.call('create_arabic_twin', { path: 'large/Golden.Report', labels: longer });
  // write it (the approving server)
  const p2 = await s.call('create_arabic_twin', { path: 'large/Golden.Report', labels });
  await s.call('approve_plan', { planId: p2.j.plan.planId });
  const tw = await s.call('create_arabic_twin', { path: 'large/Golden.Report', labels, planId: p2.j.plan.planId });
  chk(() => !tw.err && tw.j.written, () => `setup. the twin is written: ${short(tw)}`);
  const TWIN = path.join(ROOT, 'large/Golden AR.Report');
  const ext = rd(path.join(TWIN, 'definition/reportExtensions.json')), extMeasures = ext.entities.flatMap((e) => e.measures.map((m) => Object.assign({ entity: e.name }, m)));
  const arTitles = extMeasures.filter((m) => /^Title AR: /.test(m.name));
  chk(() => arTitles.length === 4 && arTitles.every((m) => /أعلى " & _s & " من " & _n & ": النقاط حسب/.test(m.expression) && /RETURN IF \( _s = _n, "النقاط حسب/.test(m.expression) && m.dataType === 'Text'), () => `T-1. the twin has its own Arabic title measures, the same DAX with the Arabic texts: ${JSON.stringify(arTitles.map((m) => [m.name, m.expression.slice(-200)]))}`);
  const titleRefs = (pages) => pages.flatMap((pg) => pg.visuals.map((v) => { const t = ((((v.visual || {}).visualContainerObjects || {}).title || [])[0] || {}).properties || {}; return t.text && t.text.expr && t.text.expr.Measure ? t.text.expr.Measure.Property : null; }).filter(Boolean));
  const twinPages = pagesOf('large/Golden AR.Report'), origPages = pagesOf('large/Golden.Report');
  chk(() => titleRefs(twinPages).length === titleRefs(origPages).length && titleRefs(twinPages).every((n) => /^Title AR: /.test(n)) && titleRefs(origPages).every((n) => /^Title: /.test(n)), () => `T-1. every twin title measure reference is the Arabic one; the original keeps its own: twin ${titleRefs(twinPages)} | original ${titleRefs(origPages)}`);
  chk(() => JSON.stringify(snapshot(ORIG)) === JSON.stringify(before) && JSON.stringify(snapshot(MODEL)) === JSON.stringify(modelBefore), () => 'T-1. the original report and the model are not changed');
  const ck = await s.call('check_report', { path: 'large/Golden AR.Report' });
  chk(() => !ck.err && ck.j.validator && ck.j.validator.errors === 0, () => `T-1. Microsoft's validator: no errors on the twin: ${ck.err ? ck.t : JSON.stringify(ck.j.validator)}`);
  // a title measure built from a value of the model: not translated, with why
  {
    const pd = await s.call('create_arabic_twin', { path: 'large/Dyn.Report' });
    const nt = (!pd.err && pd.j.titleMeasures && pd.j.titleMeasures.notTranslated) || [];
    chk(() => nt.some((x) => /Region now/.test(x.measure) && /DAX/.test(x.why)) && !(pd.j.texts || []).some((t) => /Region: /.test(t.text || '')), () => `T-1. a title measure that builds its text from the model is listed as not translated, with why, and offers no text: ${pd.err ? pd.t : JSON.stringify(pd.j.titleMeasures)}`);
  }

  // ---------- T-2: buttons fit their Arabic text ----------
  const rule = (id) => (ck.j && ck.j.findings || []).filter((f) => f.rule === id);
  chk(() => rule('BUTTON_ONE_LINE').length === 0 && rule('PAGE_BUTTON_WRAP').length === 0, () => `T-2. check_report on the twin: 0 BUTTON_ONE_LINE, 0 PAGE_BUTTON_WRAP: ${JSON.stringify(rule('BUTTON_ONE_LINE').concat(rule('PAGE_BUTTON_WRAP')).map((f) => f.what))}`);
  {
    // inside its page or group, and no two visuals of the same container overlap that did not overlap in the original
    const box = (v) => v.position;
    const over = (a, b) => a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5;
    const bad = [];
    twinPages.forEach((pg, i) => {
      const op = origPages[i], byName = Object.fromEntries(pg.visuals.map((v) => [v.name, v])), oByName = Object.fromEntries(op.visuals.map((v) => [v.name, v]));
      pg.visuals.forEach((v) => {
        const W = v.parentGroupName ? byName[v.parentGroupName].position.width : pg.page.width;
        if (box(v).x < -0.5 || box(v).x + box(v).width > W + 0.5) bad.push(`${v.name} outside its container`);
        pg.visuals.forEach((u) => { if (u.name < v.name && (u.parentGroupName || '') === (v.parentGroupName || '') && !u.visualGroup && !v.visualGroup && over(box(u), box(v)) && !over(box(oByName[u.name]), box(oByName[v.name]))) bad.push(`${u.name} now overlaps ${v.name}`); });
      });
    });
    chk(() => !bad.length, () => `T-2. widened buttons stay inside their container and overlap nothing new: ${bad.join('; ')}`);
    const widened = (p2.j.fitted && p2.j.fitted.buttons) || [];
    chk(() => widened.length >= 3 && widened.every((b) => b.width >= b.needs), () => `T-2. the plan lists every widened button with its new width: ${JSON.stringify(p2.j.fitted)}`);
    // the active page's underline follows its button
    const det = twinPages.find((pg) => pg.page.displayName === 'التفاصيل'), btn = det && det.visuals.find((v) => v.visual && v.visual.visualType === 'actionButton' && lit((((v.visual.objects || {}).text || [])[1] || {}).properties && v.visual.objects.text[1].properties.text) === 'التفاصيل');
    const line = btn && det.visuals.find((v) => v.visual && v.visual.visualType === 'shape' && v.parentGroupName === btn.parentGroupName && v.position.height <= 4);
    chk(() => btn && line && line.position.x >= btn.position.x && line.position.x + line.position.width <= btn.position.x + btn.position.width && btn.position.width - line.position.width <= 10, () => `T-2. the underline stays under its widened page button: ${btn ? JSON.stringify(btn.position) : 'no button'} | ${line ? JSON.stringify(line.position) : 'no line'}`);
    chk(() => !pc.err && pc.j.fitted && (pc.j.fitted.buttonsCut || []).some((b) => b.needs > b.room && /shorter/i.test(b.why)), () => `T-2. a button text with no room is listed in the plan (needs, room, a shorter text): ${pc.err ? pc.t : JSON.stringify(pc.j.fitted)}`);
  }

  // ---------- T-3: KPI values right-aligned ----------
  {
    const cards = twinPages.filter((pg) => pg.page.type !== 'Tooltip').flatMap((pg) => pg.visuals.filter((v) => v.visual && v.visual.visualType === 'cardVisual' && ((v.visual.query || {}).queryState || {}).Data));
    const align = (v) => ((v.visual.objects || {}).value || []).filter((e) => e.selector && e.selector.id === 'default').map((e) => lit(e.properties.horizontalAlignment));
    chk(() => cards.length >= 3 && cards.every((v) => align(v).length && align(v).every((a) => a === 'right' || a === 'center') && !align(v).includes('left')), () => `T-3. every KPI card's value is right-aligned in the twin: ${JSON.stringify(cards.map(align))}`);
    const ocards = origPages.flatMap((pg) => pg.visuals.filter((v) => v.visual && v.visual.visualType === 'cardVisual')), byName = Object.fromEntries(ocards.map((v) => [v.name, v]));
    const margins = (v) => { const p = (((v.visual.objects || {}).padding || []).find((e) => e.selector && e.selector.id === 'default') || {}).properties || {}; return [lit(p.leftMargin), lit(p.rightMargin)]; };
    chk(() => cards.every((v) => { const o = margins(byName[v.name]), t = margins(v); return t[0] === o[1] && t[1] === o[0]; }), () => `T-3. the card's inner left and right margins swap with its value: ${JSON.stringify(cards.map((v) => [margins(byName[v.name]), margins(v)]))}`);
  }

  // ---------- T-4: Arabic table headers fit their columns ----------
  {
    const theme = rd(tree(path.join(TWIN, 'StaticResources/RegisteredResources')).find((f) => /theme\.json$/.test(f)));
    const T = +(((((theme.visualStyles || {}).tableEx || {})['*'] || {}).columnHeaders || [{}])[0].fontSize) || 10;
    const bad = [];
    twinPages.forEach((pg) => pg.visuals.filter((v) => v.visual && v.visual.visualType === 'tableEx').forEach((v) => {
      const sc = pg.page.height / 1080, cw = (v.visual.objects || {}).columnWidth || [], width = (q) => { const e = cw.find((x) => x.selector && x.selector.metadata === q); return e ? parseFloat(lit(e.properties.value)) : null; };
      const sum = cw.reduce((a, e) => a + parseFloat(lit(e.properties.value)), 0);
      if (sum > v.position.width - 36 * sc + 0.5) bad.push(`${v.name}: columns ${sum} wider than the table's ${v.position.width} less 36`);
      // (TW1, M1-S2: a hidden column, width 0, has no header to fit: the twin's right-to-left table hides its name column
      // as the writer's does, round 23; check_report's tableHeaders skips it too)
      v.visual.query.queryState.Values.projections.forEach((p) => { const cwid = width(p.queryRef); if (cwid == null || cwid <= 1 || !p.displayName) return; const need = textWidth(p.displayName, T, true, 'Segoe UI') + 24 * sc; if (cwid + 0.5 < need) bad.push(`${v.name}/${p.queryRef}: ${cwid} for a header that needs ${Math.ceil(need)}`); });
    }));
    const cut = (p2.j.fitted && p2.j.fitted.headersCut) || [];
    chk(() => !bad.length || bad.length === cut.length, () => `T-4. every Arabic header fits its column within the table's width, or is listed in the plan: ${bad.join('; ')} | plan ${JSON.stringify(cut)}`);
    chk(() => ((p2.j.fitted && p2.j.fitted.headers) || []).length >= 1, () => `T-4. the plan lists the widened columns: ${JSON.stringify(p2.j.fitted)}`);
    // numbers are never narrowed: each number column keeps at least its width in the original
    const onums = Object.fromEntries(origPages.flatMap((pg) => pg.visuals.filter((v) => v.visual && v.visual.visualType === 'tableEx').map((v) => [v.name, v])));
    const narrowed = [];
    twinPages.forEach((pg) => pg.visuals.filter((v) => v.visual && v.visual.visualType === 'tableEx').forEach((v) => {
      const o = onums[v.name], w0 = (x, q) => { const e = (((x.visual.objects || {}).columnWidth) || []).find((y) => y.selector && y.selector.metadata === q); return e ? parseFloat(lit(e.properties.value)) : null; };
      o.visual.query.queryState.Values.projections.filter((p) => p.field.Measure || p.field.Aggregation).forEach((p) => { if (w0(v, p.queryRef) + 0.5 < w0(o, p.queryRef)) narrowed.push(p.queryRef); });
    }));
    chk(() => !narrowed.length, () => `T-4. no number column is narrowed: ${narrowed.join(', ')}`);
  }
} finally { await s.close(); await w.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

console.log(problems.length ? `FAIL  rc24  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  rc24  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
