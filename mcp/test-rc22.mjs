// rc.22: the fixes from the owner's own Desktop test of 0.2.9-rc.21 (18 Oct 2026, Claude Desktop, made-up models), each
// written red first. The approval window passed in every case; these are what the test found besides.
//   B-137: the Arabic twin of a report DataArcus wrote mirrors its main pages (the page background is DataArcus's own
//          transparent placeholder, not a picture); a page on a real background picture still stays left to right
//   B-140: every visual type plan_layout's plan shows is the type create_report writes (golden models, and a column
//          chart by a many-valued name field)
//   B-132: colors { accent } with no theme or design: the brand colour is exact, the first data colour, and the plan shows
//          the data colours it derives from it (generate_theme's harmony)
//   B-141: the plan lists every file the write makes (the .pbip too), for create_report and create_arabic_twin
//   B-142: check_report's validator counts agree with its findings' severities; no TOOLTIP_SCROLL on DataArcus's own
//          month tooltip page (kept to its last 6 months)
//   B-144: check_model_health says plainly when a report of the model could not be read, and why
//   B-133: plan_layout on a large model with no focus gives no plan id: it asks for an area
//   B-134: create_report reports a plan that is not approved before (or with) a missing input; after "Not now" the plan
//          is "refused"
//   B-138: in the twin, a button that goes to a page takes that page's approved Arabic name by default, shown in the plan
//   B-135: the approval page shows the colours as swatches, with the plan's real data colours
//   B-139: the twin's approval page names each text by what it is and its text, not by internal ids
//   node test-rc22.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 400) : JSON.stringify(x.j).slice(0, 400));
const get = (url) => new Promise((resolve) => { http.get(url, (res) => { let t = ''; res.setEncoding('utf8'); res.on('data', (c) => { t += c; }); res.on('end', () => resolve(t)); }).on('error', () => resolve('')); });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tree = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? tree(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-rc22-'));
const cp = (from, to) => fs.cpSync(path.join(REPO, from), path.join(ROOT, to), { recursive: true });
cp('mcp/test-models/arabic-long-names', 'arabic'); cp('mcp/fixtures/health-project', 'health');
cp('mcp/test-models/large-synthetic/Large Synthetic.SemanticModel', 'large/Large Synthetic.SemanticModel');
cp('scripts/tests/fixtures/model-health/tmdl-ramadan/definition', 'ramadan/Ramadan Test.SemanticModel/definition');
fs.writeFileSync(path.join(ROOT, 'ramadan/Ramadan Test.SemanticModel/definition.pbism'), '{ "version": "4.0", "settings": {} }');
cp('scripts/tests/fixtures/bridge-project', 'bridge');
cp('scripts/tests/fixtures/logos/wide.png', 'pictures/wide.png');
// a small model: a fact table and a lookup table of plan groups (a many-valued "... Name" field)
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
fs.mkdirSync(path.join(ROOT, 'plans/Plans.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'plans/Plans.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
  { name: 'Sales', partitions: mp('Sales'), columns: [{ name: 'Amount', dataType: 'double', sourceColumn: 'Amount' }, { name: 'GroupKey', dataType: 'int64', sourceColumn: 'GroupKey' }, { name: 'Region', dataType: 'string', sourceColumn: 'Region' }, { name: 'Date', dataType: 'dateTime', sourceColumn: 'Date' }],
    measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }, { name: 'Orders', expression: 'COUNTROWS ( Sales )', formatString: '#,0' }] },
  { name: 'Plan Groups', partitions: mp('Plan Groups'), columns: [{ name: 'GroupKey', dataType: 'int64', sourceColumn: 'GroupKey' }, { name: 'Plan Group Name', dataType: 'string', sourceColumn: 'Plan Group Name' }] },
  // (B-142: a month name in a table with a date column: the writer's month tooltip keeps the last 6 months)
  { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [{ name: 'Date', dataType: 'dateTime', sourceColumn: 'Date', isKey: true }, { name: 'Month Name', dataType: 'string', sourceColumn: 'Month Name' }] }],
  relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'GroupKey', toTable: 'Plan Groups', toColumn: 'GroupKey' }, { name: 'r2', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } }));

const log = path.join(ROOT, 'links.txt'), links = () => (fs.existsSync(log) ? fs.readFileSync(log, 'utf8').split('\n').filter(Boolean) : []);
const linkAt = async (i) => { for (let k = 0; k < 100 && links().length <= i; k++) await sleep(50); return links()[i] || ''; };
// two servers: one whose browser clicks Approve (the person approves), one whose browser only notes the link (to read the page)
const s = await serverClient(ROOT, {}), w = await serverClient(ROOT, { DATAARCUS_TEST_CLICK: 'log:' + log, DATAARCUS_APPROVAL_WAIT_MS: '200' });
const approve = async (srv, id) => srv.call('approve_plan', { planId: id });
// a report through the gate: plan_layout with the inputs, approve_plan (the test browser clicks Approve), create_report
const report = async (args, plan) => {
  const pl = await s.call('plan_layout', Object.assign({}, plan || {}, { path: args.path, name: args.name }, args.pages ? { pages: args.pages } : {}, args.lang ? { lang: args.lang } : {}, args.fields ? { planFields: args.fields } : {}, args.colors ? { colors: args.colors } : {}, args.focus ? { focus: args.focus } : {}, args.secondPage === false ? { secondPage: false } : {}));
  if (!pl.j || !pl.j.plan || !pl.j.plan.planId) return { pl, r: pl };
  await approve(s, pl.j.plan.planId);
  const r = await s.call('create_report', Object.assign({}, args, { planId: pl.j.plan.planId }, args.pages ? {} : { design: pl.j.design }));
  return { pl, r };
};
const pagesOf = (rep) => { const dir = path.join(ROOT, rep, 'definition/pages'), order = rd(path.join(dir, 'pages.json')).pageOrder;
  return order.map((id) => ({ id, page: rd(path.join(dir, id, 'page.json')), visuals: fs.existsSync(path.join(dir, id, 'visuals')) ? fs.readdirSync(path.join(dir, id, 'visuals')).map((v) => rd(path.join(dir, id, 'visuals', v, 'visual.json'))) : [] })); };
const TYPE = { column: 'clusteredColumnChart', bar: 'clusteredBarChart', line: 'lineChart', donut: 'donutChart', table: 'tableEx' };

try {
  // ---------- B-137: the twin of a report DataArcus wrote ----------
  {
    const { r } = await report({ path: 'health', name: 'Twin Source', secondPage: true }, { layout: 'exec' });
    chk(() => !r.err, () => `B-137 setup. create_report writes the report: ${short(r)}`);
    const tw = await s.call('create_arabic_twin', { path: 'health/Twin Source.Report' });
    chk(() => !tw.err && !tw.j.picturePages && tw.j.pages.filter((p) => !p.tooltip).every((p) => !p.leftToRight), () => `B-137. every main page of DataArcus's own report is mirrored (its background is the transparent placeholder, not a picture): ${short(tw)}`);
    // a hand-placed page on a real picture keeps its page left to right
    const pic = await report({ path: 'health', name: 'Picture Page', pages: [{ name: 'On a picture', width: 1280, height: 720, background: 'pictures/wide.png', slots: [{ kind: 'kpi', x: 40, y: 40, w: 300, h: 120 }, { kind: 'bar', x: 40, y: 200, w: 600, h: 400 }] }] });
    chk(() => !pic.r.err, () => `B-137 setup. a report on a background picture: ${short(pic.r)}`);
    const tp = await s.call('create_arabic_twin', { path: 'health/Picture Page.Report' });
    chk(() => !tp.err && tp.j.picturePages && tp.j.picturePages.length === 1, () => `B-137. a page on a real background picture stays left to right: ${short(tp)}`);
  }

  // ---------- B-140: the plan's visual types are the written ones ----------
  {
    const cases = [{ path: 'arabic', lang: 'ar' }, { path: 'health' }, { path: 'large', focus: 'logistics' }, { path: 'ramadan' },
      { path: 'plans', fields: { kpis: ['Sales[Total Sales]', 'Sales[Orders]'], category: 'Sales[Region]', category2: 'Plan Groups[Plan Group Name]' } }];
    for (const c of cases) {
      const name = 'Kinds ' + c.path;
      const { pl, r } = await report(Object.assign({ name, secondPage: false }, c), { layout: 'exec' });
      if (r.err) { chk(() => false, () => `B-140 ${c.path}. the report is written: ${short(r)}`); continue; }
      const planned = pl.j.slots.filter((x) => TYPE[x.kind]).map((x) => TYPE[x.kind]).sort().join();
      const first = pagesOf(path.join(c.path, name + '.Report'))[0];
      const written = first.visuals.filter((v) => v.visual && Object.values(TYPE).includes(v.visual.visualType) && v.position.tabOrder != null).map((v) => v.visual.visualType).sort().join();
      chk(() => planned === written, () => `B-140 ${c.path}. the plan's chart types are the written ones: plan ${planned} | written ${written}`);
    }
  }

  // ---------- B-132: an accent alone gives the data colours ----------
  {
    const pl = await s.call('plan_layout', { path: 'large', focus: 'logistics', colors: { accent: '#0F766E' }, layout: 'exec' });
    chk(() => !pl.err && pl.j.design.data[0].toLowerCase() === '#0f766e' && pl.j.design.ui.accent.toLowerCase() === '#0f766e' && !/#1f4e79/i.test(pl.j.design.data.join()), () => `B-132. the accent is the first data colour and the accent, no Corporate navy: ${pl.err ? pl.t.slice(0, 300) : JSON.stringify(pl.j.design.data)}`);
    chk(() => !pl.err && pl.j.colours && Array.isArray(pl.j.colours.data) && pl.j.colours.data[0].toLowerCase() === '#0f766e' && /accent/i.test(pl.j.colours.sayInPlan || ''), () => `B-132. the plan shows the data colours derived from the accent: ${pl.err ? '' : JSON.stringify(pl.j.colours)}`);
    const { r } = await report({ path: 'large', focus: 'logistics', name: 'Accent Report', colors: { accent: '#0F766E' }, secondPage: false }, { layout: 'exec' });
    const th = !r.err && tree(path.join(ROOT, 'large', 'Accent Report.Report/StaticResources/RegisteredResources')).find((f) => /\.json$/.test(f));
    chk(() => th && rd(th).dataColors[0].toLowerCase() === '#0f766e', () => `B-132. the written theme's first data colour is the accent: ${r.err ? short(r) : th ? JSON.stringify(rd(th).dataColors) : 'no theme'}`);
  }

  // ---------- B-141: every written file is listed ----------
  {
    const before = new Set(fs.readdirSync(path.join(ROOT, 'arabic')));
    const pl = await s.call('plan_layout', { path: 'arabic', name: 'Listed', lang: 'ar', layout: 'exec', secondPage: false });
    await approve(s, pl.j.plan.planId);
    const r = await s.call('create_report', { path: 'arabic', name: 'Listed', lang: 'ar', secondPage: false, planId: pl.j.plan.planId, design: pl.j.design });
    const made = fs.readdirSync(path.join(ROOT, 'arabic')).filter((n) => !before.has(n));
    const listed = pl.j.plan.writesAfterGo.join(' ').split('<name>').join('Listed');
    chk(() => !r.err && made.length >= 2 && made.every((n) => listed.includes(n)), () => `B-141. create_report's plan lists every file written: written ${made.join(', ')} | listed ${listed}`);
    const tb = new Set(fs.readdirSync(path.join(ROOT, 'arabic'))), tw = await s.call('create_arabic_twin', { path: 'arabic/Listed.Report' });
    if (!tw.err && tw.j.plan) { await approve(s, tw.j.plan.planId); const tr = await s.call('create_arabic_twin', { path: 'arabic/Listed.Report', planId: tw.j.plan.planId });
      const tmade = fs.readdirSync(path.join(ROOT, 'arabic')).filter((n) => !tb.has(n)), tlisted = tw.j.plan.writesAfterGo.join(' ');
      chk(() => !tr.err && tmade.length >= 2 && tmade.every((n) => tlisted.includes(n)), () => `B-141. the twin's plan lists every file written: written ${tmade.join(', ')} | listed ${tlisted}`); }
    else chk(() => false, () => `B-141. the twin plans: ${short(tw)}`);
  }

  // ---------- B-142: check_report's counts, and the month tooltip page ----------
  {
    const { r } = await report({ path: 'plans', name: 'Checked', secondPage: true, fields: { kpis: ['Sales[Total Sales]'], timeAxis: 'Calendar[Month Name]', category: 'Sales[Region]' } }, { layout: 'exec' });
    const tips = !r.err ? pagesOf('plans/Checked.Report').filter((p) => p.page.type === 'Tooltip') : [];
    chk(() => tips.some((p) => p.visuals.some((v) => JSON.stringify(v.filterConfig || {}).includes('Last 6 months'))), () => `B-142 setup. the report's month tooltip keeps the last 6 months: ${r.err ? short(r) : tips.length + ' tooltip pages'}`);
    const c = await s.call('check_report', { path: 'plans/Checked.Report' });
    const vErr = !c.err && c.j.findings.filter((f) => f.origin === 'validator' && f.severity === 'error').length;
    chk(() => !r.err && !c.err && c.j.validator.ran && c.j.validator.errors === vErr && c.j.counts.errors >= c.j.validator.errors, () => `B-142. validator.errors counts the validator's findings that are errors (${vErr}): ${c.err ? c.t.slice(0, 300) : JSON.stringify(c.j.validator) + ' counts ' + JSON.stringify(c.j.counts)}`);
    chk(() => !c.err && !(c.j.counts.byRule || {}).TOOLTIP_SCROLL, () => `B-142. no TOOLTIP_SCROLL on DataArcus's own tooltip pages (the month trend is kept to its last 6 months): ${c.err ? '' : JSON.stringify(c.j.counts.byRule)}`);
  }

  // ---------- B-144: a report that can't be read is said, with why ----------
  {
    const h = await s.call('check_model_health', { path: 'bridge' });
    chk(() => !h.err && h.j.reportRead === false && /Sales/.test(h.j.reportNotRead || '') && /definition folder/.test(h.j.reportNotRead || '') && /not checked/.test(h.j.reportNotRead || ''), () => `B-144. the answer says the Sales report could not be read, why, and that unused columns were not checked: ${short(h)}`);
    chk(() => !h.err && h.j.reports && Array.isArray(h.j.reports.notRead) && h.j.reports.notRead.some((x) => x.report === 'Sales'), () => `B-144. the reports list names it as not read: ${h.err ? '' : JSON.stringify(h.j.reports)}`);
  }

  // ---------- B-133: a large model and no focus: no plan id ----------
  {
    const pl = await s.call('plan_layout', { path: 'large', layout: 'exec' });
    chk(() => !pl.err && !(pl.j.plan && pl.j.plan.planId) && (pl.j.planProblems || []).some((p) => /area|focus/i.test(p)), () => `B-133. a 300-table model with no focus: no plan id, and the plan asks for an area: ${short(pl)}`);
  }

  // ---------- B-134: approval before inputs; "refused" after Not now ----------
  {
    const pl = await w.call('plan_layout', { path: 'health', name: 'Order Test', layout: 'exec', secondPage: false });
    const id = pl.j.plan.planId;
    const noName = await w.call('create_report', { path: 'health', planId: id, design: pl.j.design, secondPage: false });
    chk(() => noName.err && /not approved yet/.test(noName.t), () => `B-134. a plan not approved yet is said first (or with the missing input): ${noName.t.slice(0, 300)}`);
    const t1 = await w.call('generate_theme', { brand: '#123456', name: 'Refused Theme' }), tid = t1.j.plan.planId, n = links().length;
    await w.call('approve_plan', { planId: tid }); const tl = await linkAt(n);
    await new Promise((resolve) => { const u = new URL(tl), body = 'decision=decline'; const q = http.request(u, { method: 'POST', headers: { Origin: u.origin, 'Content-Type': 'application/x-www-form-urlencoded' } }, (res) => { res.resume(); res.on('end', resolve); }); q.on('error', resolve); q.write(body); q.end(); });
    const after = await w.call('generate_theme', { brand: '#123456', name: 'Refused Theme', planId: tid });
    chk(() => after.err && /refused/i.test(after.t) && !/not approved yet/.test(after.t), () => `B-134. after "Not now" the plan is refused: ${after.t.slice(0, 300)}`);
  }

  // ---------- B-138 and B-139: the twin's page buttons, and its approval page ----------
  {
    const { r } = await report({ path: 'ramadan', name: 'Nav Source', secondPage: true }, { layout: 'exec' });
    chk(() => !r.err, () => `B-138 setup: ${short(r)}`);
    const p0 = await w.call('create_arabic_twin', { path: 'ramadan/Nav Source.Report' });
    const pageTexts = (p0.j && p0.j.texts || []).filter((t) => t.kind === 'page'), buttons = (p0.j && p0.j.texts || []).filter((t) => t.kind === 'button');
    const labels = Object.fromEntries(pageTexts.map((t, i) => [t.id, ['الصفحة الأولى', 'الصفحة الثانية', 'تلميح'][i] || 'صفحة']));
    const p1 = await w.call('create_arabic_twin', { path: 'ramadan/Nav Source.Report', labels });
    const navButtons = (p1.j && p1.j.texts || []).filter((t) => t.kind === 'button' && t.goesTo);
    chk(() => buttons.length >= 2 && navButtons.length >= 2 && navButtons.every((t) => t.label === labels[t.goesTo] && /page/i.test(t.labelFrom || '')), () => `B-138. each page button takes its page's approved Arabic name in the plan: ${JSON.stringify((p1.j && p1.j.texts || []).filter((t) => t.kind === 'button'))}`);
    const n = links().length; await w.call('approve_plan', { planId: p1.j.plan.planId }); const page = await get(await linkAt(n));
    chk(() => !/button:[A-Za-z0-9]|page:[A-Za-z0-9]{6}/.test(page) && /الصفحة الأولى/.test(page) && /زر صفحة/.test(page), () => `B-139. the twin's approval page names each text by what it is (in Arabic: FX1, changed on purpose from "Page button"), not by internal ids: ${(/النصوص العربية[\s\S]{0,400}/.exec(page) || [''])[0]}`);
  }

  // ---------- B-135: colours as swatches on the approval page ----------
  {
    const pl = await w.call('plan_layout', { path: 'large', focus: 'logistics', colors: { accent: '#0F766E' }, layout: 'exec', name: 'Swatches', secondPage: false });
    const n = links().length; await w.call('approve_plan', { planId: pl.j.plan.planId }); const page = await get(await linkAt(n));
    chk(() => /class="sw"[^>]*style="background:#0F766E"/i.test(page) && !/\{&quot;accent&quot;/.test(page) && /Data colours/.test(page), () => `B-135. the approval page shows the colours as swatches with the data colours: ${(/Look and options[\s\S]{0,500}/.exec(page) || [''])[0]}`);
  }
} finally { await s.close(); await w.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

console.log(problems.length ? `FAIL  rc22  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  rc22  ${checks} checks`);
process.exit(problems.length ? 1 : 0);
