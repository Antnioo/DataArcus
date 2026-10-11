// 0.2.9 integration, the gate block's root fixes (the reviewer's routine of 11 Oct 07:36 UTC; the cross-review
// mcp/work/0.2.9-crossreview.md, findings G1-G13, R5 and the duplicates the gate block owns). Written red first.
// The owner's rule of 11 Oct: build in blocks, fix at the root inside one block, nothing tuned to his two portfolio
// reports or to fixtures: the models here are made-up retail, HR and logistics ones, not the portfolio's names.
// test.mjs runs it with its own client (import { v029i }); run alone it starts the server itself:
//   node test-0.2.9i.mjs
import fs0 from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { serverClient } from './test-0.2.9.mjs';
import { withPlans } from './test-plan.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);

// call: the helper that gets approved plans (test-plan.mjs); raw: the call without it (the gate's own checks)
export async function v029i({ call, raw, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args, c = call) => { try { return await c(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
  const get = (fn) => { try { return fn(); } catch (e) { return undefined; } };
  const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }], col = (name, dataType) => ({ name, dataType, sourceColumn: name });
  const model = (dir, tables, relationships) => { fs.mkdirSync(path.join(ROOT, dir, 'M.SemanticModel'), { recursive: true }); fs.writeFileSync(path.join(ROOT, dir, 'M.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables, relationships: relationships || [] } })); };
  const ms = (name, expression, formatString) => Object.assign({ name, expression }, formatString ? { formatString } : {});
  const visualsOf = (x, dir) => { if (x.err) return []; const D = path.join(ROOT, dir, x.j.report, 'definition', 'pages'), out = [];
    JSON.parse(fs.readFileSync(path.join(D, 'pages.json'), 'utf8')).pageOrder.forEach((id) => { const pj = JSON.parse(fs.readFileSync(path.join(D, id, 'page.json'), 'utf8')), vd = path.join(D, id, 'visuals');
      if (fs.existsSync(vd)) fs.readdirSync(vd).forEach((n) => out.push(Object.assign(JSON.parse(fs.readFileSync(path.join(vd, n, 'visual.json'), 'utf8')), { page: pj }))); }); return out; };
  const filtersOf = (v) => ((v && v.filterConfig || {}).filters || []);

  // ---------- G1 + G2: the KPI picks and the amount rule by the measure's shape and format string, not by names ----------
  model('i-retail', [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Cost', 'double'), col('Qty', 'int64'), col('Weight', 'double'), col('Order', 'string'), col('Store', 'string')],
      measures: [ms('ROI', 'DIVIDE ( SUM ( Sales[Amount] ) - SUM ( Sales[Cost] ), SUM ( Sales[Cost] ) )', '0.0%'), ms('AOV', 'DIVIDE ( SUM ( Sales[Amount] ), DISTINCTCOUNT ( Sales[Order] ) )', '"INR" #,0.00'),
        ms('Revenue INR', 'SUM ( Sales[Amount] )', '"INR" #,0'), ms('Units Sold', 'SUM ( Sales[Qty] )', '#,0 "pcs"'), ms('Shipped Weight', 'SUM ( Sales[Weight] )', '#,0 "kg"'),
        ms('Orders', 'DISTINCTCOUNT ( Sales[Order] )', '#,0'), ms('Cost CAD', 'SUM ( Sales[Cost] )', '"CAD" #,0'), ms('Gross Rupees', 'SUM ( Sales[Amount] )', '₹#,0')] },
    { name: 'Survey', partitions: mp('Survey'), columns: [col('Score', 'double')], measures: [ms('NPS', 'AVERAGE ( Survey[Score] ) * 10', '0.0'), ms('CSAT', 'AVERAGE ( Survey[Score] )', '0.0')] },
    { name: 'Staff', partitions: mp('Staff'), columns: [col('Name', 'string')], measures: [ms('Headcount', 'COUNTROWS ( Staff )', '#,0')] }]);
  {
    const s = await ask('suggest_fields', { path: 'i-retail', kpis: 4 }), k = (s.j && s.j.kpis || []).filter(Boolean), names = k.map((x) => x.m);
    const PLAIN = ['Revenue INR', 'Units Sold', 'Shipped Weight', 'Orders', 'Cost CAD', 'Gross Rupees', 'Headcount'];
    chk(() => k.length === 4 && names.slice(0, 3).every((n) => PLAIN.includes(n)) && names.includes('Revenue INR') && names[3] === 'ROI',
      () => `G1: the cards must be plain sums and counts first (a currency code such as INR is no acronym), then one ratio: ${JSON.stringify(names)}`);
    const all = await ask('suggest_fields', { path: 'i-retail', kpis: 8 }), by = Object.fromEntries((all.j && all.j.kpis || []).filter(Boolean).map((x) => [x.m, x]));
    chk(() => by['Units Sold'].wholeFormat && by['Shipped Weight'].wholeFormat && !by['Revenue INR'].wholeFormat && !by['Cost CAD'].wholeFormat && by.Orders.wholeFormat === '#,0',
      () => `G2: a unit in the format ("pcs", "kg") is no currency: those stay whole; INR and CAD are amounts: ${JSON.stringify(Object.fromEntries(Object.entries(by).map(([n, x]) => [n, x.wholeFormat || null])))}`);
    const B = req('../assets/js/pbip-bind.js');
    chk(() => !B.measureCard({ name: 'Gross Rupees', formatString: '₹#,0', expression: 'SUM ( Sales[Amount] )' }).wholeFormat && !B.measureCard({ name: 'X', formatString: '#,0 "JPY"', expression: 'SUM ( T[A] )' }).wholeFormat
      && B.measureCard({ name: 'Value Index', formatString: '#,0', expression: 'SUMX ( T, T[A] )' }).wholeFormat,
      () => 'G2: a currency symbol or an ISO 4217 code makes an amount; "value" in a name alone does not');
  }

  // ---------- G11: a month label sorts by a date only in a date table (or a label made from that date) ----------
  model('i-pay', [
    { name: 'Payments', partitions: mp('Payments'), columns: [col('Paid', 'double'), col('Order Date', 'dateTime'), col('Payment Period', 'string'), col('Branch', 'string')],
      measures: [ms('Total Paid', 'SUM ( Payments[Paid] )', '#,0')] },
    { name: 'Dates', dataCategory: 'Time', partitions: mp('Dates'), columns: [col('Date', 'dateTime'), col('Month Label', 'string')] }]);
  {
    const B = req('../assets/js/pbip-bind.js');
    chk(() => typeof B.fieldOf === 'function' && (!B.fieldOf({ name: 'Payments', columns: [col('Order Date', 'dateTime'), col('Payment Period', 'string')] }, 'Payment Period').dateOf
      && B.fieldOf({ name: 'Dates', dataCategory: 'Time', columns: [col('Date', 'dateTime'), col('Month Label', 'string')] }, 'Month Label').dateOf.c === 'Date'),
      () => 'G11: "Payment Period" of a fact table gets no date to sort by; a month label of the date table does');
    const pl = await ask('plan_layout', { layout: 'exec', path: 'i-pay', planFields: { timeAxis: 'Payments[Payment Period]', measure: 'Payments[Total Paid]' } });
    chk(() => !pl.err && !/month start/i.test(pl.j.timeAxis.how) && /A to Z/.test(pl.j.timeAxis.how), () => `G11: the plan must not promise a time order it can't give "Payment Period": ${JSON.stringify(pl.j && pl.j.timeAxis)}`);
  }

  // ---------- G9: one field builder, the picker's ----------
  {
    const B = req('../assets/js/pbip-bind.js'), src = fs.readFileSync(path.join(HERE, 'server.mjs'), 'utf8');
    chk(() => typeof B.fieldOf === 'function' && /Bind\.fieldOf\(/.test(src) && !/Bind\.dateColumnFor\(t\.columns/.test(src), () => 'G9: pbip-bind exports fieldOf and create_report\'s field check uses it');
  }

  // ---------- G3: the tooltip's month trend keeps a sorted month name's order ----------
  model('i-hr', [
    { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')] },
    { name: 'Hires', partitions: mp('Hires'), columns: [col('Hire Date', 'dateTime'), col('Department', 'string'), col('Grade', 'string')],
      measures: [ms('Hires', 'COUNTROWS ( Hires )', '#,0'), ms('Leavers', 'COUNTROWS ( Hires ) * 0', '#,0')] }],
    [{ name: 'r', fromTable: 'Hires', fromColumn: 'Hire Date', toTable: 'Calendar', toColumn: 'Date' }]);
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 'i-hr' });
    const x = await ask('create_report', { path: 'i-hr', name: 'I HR', design: pl.j && pl.j.design, fields: { kpis: ['Hires[Hires]'], measure: 'Hires[Hires]', timeAxis: 'Calendar[Month Name]', category: 'Hires[Department]' }, noDataMessage: false, secondPage: false });
    const trend = visualsOf(x, 'i-hr').filter((v) => v.page.type === 'Tooltip' && v.visual && v.visual.visualType === 'clusteredBarChart' && /Month Name/.test(JSON.stringify(v.visual.query.queryState.Category)));
    chk(() => trend.length === 1 && !filtersOf(trend[0]).some((f) => f.field.Measure) && !/Month start/.test(JSON.stringify(trend[0].visual.query.sortDefinition || {})) && trend[0].page.height === 410,   /* (a column the model sorts needs no sort of the report's: it follows the model) */
      () => `G3: a sorted month name on the tooltip keeps its 12 months in the model's order: ${JSON.stringify(trend.map((v) => ({ f: filtersOf(v), s: v.visual.query.sortDefinition, h: v.page.height }))).slice(0, 400)} ${short(x)}`);
    // G13: a page without a chart gets no note about blank categories
    const t = await ask('create_report', { path: 'i-hr', name: 'I HR table', fields: { kpis: ['Hires[Hires]'], table: ['Hires[Department]', 'Hires[Hires]'] }, noDataMessage: false,
      pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'table', x: 24, y: 80, w: 600, h: 400 }] }] });
    chk(() => !t.err && !JSON.stringify(t.j.reportNotes || []).includes('blank category'), () => `G13: no chart, no note about blank categories: ${short(t)}`);
  }

  // ---------- G5: the approved plan's fields are the report's ----------
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 'i-hr', planFields: { kpis: ['Hires[Hires]'], measure: 'Hires[Hires]' } }, raw), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await ask('approve_plan', { planId: pid, userReply: 'go' }, raw);
    const other = await ask('create_report', { path: 'i-hr', name: 'I other', planId: pid, design: pl.j && pl.j.design, fields: { kpis: ['Hires[Leavers]'], measure: 'Hires[Hires]' }, noDataMessage: false, secondPage: false }, raw);
    chk(() => other.err && /approved plan/.test(other.t) && /kpis/.test(other.t), () => `G5: create_report with fields other than the approved plan's must be refused, naming them: ${short(other)}`);
    const same = await ask('create_report', { path: 'i-hr', name: 'I same', planId: pid, design: pl.j && pl.j.design, fields: { kpis: ['Hires[Hires]'], measure: 'Hires[Hires]' }, noDataMessage: false, secondPage: false }, raw);
    chk(() => !same.err && same.j.report, () => `G5: the approved fields are written: ${short(same)}`);
  }

  // ---------- G6: the plan's time axis is the writer's own decision ----------
  {
    const Px = req('../assets/js/pbip-export.js'), B = req('../assets/js/pbip-bind.js');
    const pl = await ask('plan_layout', { layout: 'exec', path: 'i-hr', planFields: { timeAxis: 'Calendar[Month Name]' } });
    chk(() => typeof Px.timeAxisPlan === 'function' && pl.j.timeAxis.order === Px.timeAxisPlan(B.fieldOf({ name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime'), Object.assign(col('Month Name', 'string'), { sortByColumn: 'Month Number' }), col('Month Number', 'int64')] }, 'Month Name')).order,
      () => `G6: plan_layout's timeAxis comes from the writer's timeAxisPlan: ${JSON.stringify(pl.j && pl.j.timeAxis)}`);
  }

  // ---------- G8: the bar chart's name share, against known widths ----------
  {
    const Px = req('../assets/js/pbip-export.js');
    // measured: a 508-wide bar chart on a 1080-high page needed 50 for 25 characters (REPORT-FIXES-LAB, B2); a chart as
    // wide as a 1280 x 720 page's main area (1232) keeps 40
    chk(() => typeof Px.barNameShare === 'function' && Px.barNameShare(508, 1080) === 50 && Px.barNameShare(1232, 720) === 40, () => 'G8: the bar name share must be 50 for the measured 508-wide chart and 40 for a wide one');
  }

  // ---------- G10: the website's tooltip check finds the last-months filter by its shape, not its name ----------
  {
    const RC = await import(pathToFileURL(path.join(REPO, 'scripts/tests/report-check.mjs')).href);
    model('i-ship', [
      { name: 'Calendar', dataCategory: 'Time', partitions: mp('Calendar'), columns: [col('Date', 'dateTime'), col('Month-Year', 'string')] },
      { name: 'Shipments', partitions: mp('Shipments'), columns: [col('Ship Date', 'dateTime'), col('Carrier', 'string'), col('Kg', 'double')], measures: [ms('Shipments', 'COUNTROWS ( Shipments )', '#,0')] }],
      [{ name: 'r', fromTable: 'Shipments', fromColumn: 'Ship Date', toTable: 'Calendar', toColumn: 'Date' }]);
    const x = await ask('create_report', { path: 'i-ship', name: 'I ship', design: (await ask('plan_layout', { layout: 'exec', path: 'i-ship' })).j.design, fields: { kpis: ['Shipments[Shipments]'], measure: 'Shipments[Shipments]', timeAxis: 'Calendar[Month-Year]', category: 'Shipments[Carrier]' }, noDataMessage: false, secondPage: false });
    const files = {}; if (!x.err) { const base = path.join(ROOT, 'i-ship', x.j.report); const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else files[path.relative(path.dirname(base), f).split(path.sep).join('/')] = Buffer.from(fs.readFileSync(f, 'utf8').split('Last 6 months').join('Letzte 6 Monate')); }); walk(base); }
    const r = RC.tooltipPageProblems(files);
    chk(() => r.trend === 1 && !r.bad.length, () => `G10: a renamed last-6-months measure must still be read as the trend kept to 6 months: ${JSON.stringify(r).slice(0, 300)} ${short(x)}`);
  }

  // ---------- R5: check_report's lint gives a visual's type and position, never its title ----------
  {
    const x = await ask('create_report', { path: 'i-ship', name: 'I overlap', fields: { kpis: ['Shipments[Shipments]'], measure: 'Shipments[Shipments]', category: 'Shipments[Carrier]', category2: 'Shipments[Carrier]' }, noDataMessage: false, subtitles: {},
      pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'bar', title: 'Planted Secret Title', x: 24, y: 80, w: 600, h: 400 }, { kind: 'column', title: 'Another Planted Title', x: 200, y: 150, w: 600, h: 400 }] }] });
    const c = x.err ? x : await ask('check_report', { path: path.join(path.dirname(x.j.open), x.j.report), checks: ['lint'] });
    const lint = c.j && c.j.lint, txt = JSON.stringify(c.j || {});
    chk(() => lint && (lint.findings || []).length && !/Shipments by Carrier|Planted|"[^"]*\bby\b[^"]*" at/.test(JSON.stringify(lint.findings)) && /at \d+,\d+ \d+x\d+/.test(JSON.stringify(lint.findings)),
      () => `R5: the lint must name visuals by type and position only: ${JSON.stringify(lint && lint.findings).slice(0, 400)} ${short(c)}`);
  }

  // ---------- G7: one calm brand palette, in the design engine ----------
  {
    const E = req('../assets/js/design-engine.js');
    const t = await ask('generate_theme', { brand: '#7a2e8c' }), d = t.j && t.j.design;
    chk(() => typeof E.calmPalette === 'function' && JSON.stringify(d.data) === JSON.stringify(E.calmPalette('#7a2e8c', d.ui.card, d.ui.text)) && JSON.stringify(Object.assign({}, d.ui, { accent: null })) === JSON.stringify(Object.assign({}, E.PRESETS.Corporate.ui, { accent: null })),
      () => `G7: the MCP's brand palette is the design engine's calmPalette, on the Corporate light page: ${JSON.stringify(d && { data: d.data, ui: d.ui })}`);
  }

  // ---------- duplicates the gate block owns: one DAX for a visual's value, one Arabic month list, one custom-visual test ----------
  {
    // (0.2.9, the writer's A3-12: the writer is five files since, pbip-export.js and its modules; AGG_DAX is in pbip-query.js)
    const px = ['pbip-export', 'pbip-query', 'pbip-sizing', 'pbip-page', 'pbip-notes'].map((f) => path.join(REPO, 'assets/js', f + '.js')).filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n'), Px = req('../assets/js/pbip-export.js');
    const twin = fs.readFileSync(path.join(HERE, 'lib/arabic-twin.mjs'), 'utf8'), cr = fs.readFileSync(path.join(HERE, 'lib/check-report.mjs'), 'utf8'), plans = fs.readFileSync(path.join(HERE, 'lib/plans.mjs'), 'utf8');
    chk(() => (px.match(/const AGG_DAX = /g) || []).length === 1, () => `G4: one AGG_DAX in the writer: ${(px.match(/const AGG_DAX = /g) || []).length}`);
    chk(() => Array.isArray(Px.AR_MONTHS) && Px.AR_MONTHS.length === 12 && !/const MONTHS_AR = \[/.test(twin) && /AR_MONTHS/.test(twin), () => 'one Arabic month list: the writer exports AR_MONTHS and the twin uses it');
    chk(() => !/\^\[a-z\]\[A-Za-z\]\*\$/.test(cr) && /isCustom/.test(cr), () => 'one custom-visual test: check_report imports the reading block\'s isCustom');
    chk(() => !/export function approvedFor/.test(plans), () => 'G12: no unused approvedFor');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const ROOT = fs0.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-029i-')), problems = []; let checks = 0;
  const s = await serverClient(ROOT);
  await v029i({ call: withPlans(s.call), raw: s.call, check: (ok, msg) => { checks++; if (!ok) problems.push(msg); }, ROOT });
  await s.close(); fs0.rmSync(ROOT, { recursive: true, force: true });
  console.log(problems.length ? `FAIL  v029i  ${checks} checks, ${problems.length} failed\n` + problems.map((p) => '      - ' + p).join('\n') : `PASS  v029i  ${checks} checks`);
  process.exit(problems.length ? 1 : 0);
}
