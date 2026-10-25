import './test-env.mjs';
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
import { serverSource, twinSource } from './test-source.mjs';   // (0.3.1 S9: the server's code is server.mjs, tools/ and the lib/ modules it shared; the twin is lib/arabic-twin.mjs and its steps)

const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const req = createRequire(import.meta.url);

// call: the helper that gets approved plans (test-plan.mjs); raw: the call without it (the gate's own checks)
export async function v029i({ call, raw, check, ROOT, fs = fs0 }) {
  const chk = (cond, msg) => { let ok = false; try { ok = !!cond(); } catch (e) { ok = false; } let text = ''; if (!ok) { try { text = msg(); } catch (e) { text = 'the answer has not the expected shape: ' + String(e && e.message || e); } } check(ok, text); };
  const ask = async (name, args, c = call) => { try { return await c(name, args); } catch (e) { return { err: true, t: String(e && e.message || e), j: null }; } };
  const short = (x) => (x.err ? x.t.slice(0, 300) : JSON.stringify(x.j).slice(0, 300));
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
    const all = await ask('suggest_fields', { path: 'i-retail', kpis: 6 })   // (the design block's A7-5: suggest_fields takes at most LIMITS.kpiCards, 6, as plan_layout; it took 8, so the 7th
    // plain measure, Shipped Weight, is checked through the picker's own measureCard below)
    , by = Object.fromEntries((all.j && all.j.kpis || []).filter(Boolean).map((x) => [x.m, x]));
    chk(() => by['Units Sold'].wholeFormat && req('../assets/js/pbip-bind.js').measureCard({ name: 'Shipped Weight', formatString: '#,0 "kg"', expression: 'SUM ( Sales[Weight] )' }).wholeFormat && !by['Revenue INR'].wholeFormat && !by['Cost CAD'].wholeFormat && by.Orders.wholeFormat === '#,0',
      () => `G2: a unit in the format ("pcs", "kg") is no currency: those stay whole; INR and CAD are amounts: ${JSON.stringify(Object.fromEntries(Object.entries(by).map(([n, x]) => [n, x.wholeFormat || null])))}`);
    const B = req('../assets/js/pbip-bind.js');
    // (changed in writer round 9, the laptop's F4, N8-LAB measured in Desktop: a currency code AFTER the number, "#,0 \"AED\"",
    // read "50.87MAED" in automatic units; such a card now shows the number unscaled in its format. A code or sign before the
    // number stays an amount in automatic units, as G2 and the owner's O-2 want)
    chk(() => !B.measureCard({ name: 'Gross Rupees', formatString: '₹#,0', expression: 'SUM ( Sales[Amount] )' }).wholeFormat && B.measureCard({ name: 'X', formatString: '#,0 "JPY"', expression: 'SUM ( T[A] )' }).unitAuto === true   /* (round 10's review: a text suffix without padding takes automatic units with its decimals unset, N8-LAB's setting B) */
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
    const B = req('../assets/js/pbip-bind.js'), src = serverSource();
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
    chk(() => trend.length === 1 && !filtersOf(trend[0]).some((f) => f.field.Measure) && !/Month start/.test(JSON.stringify(trend[0].visual.query.sortDefinition || {})) && trend[0].page.height === 420,   /* (changed in 0.2.9 rc1, DETAIL-2 T9: 12 months need 320 by the measured bar rows, the page 420; was 410) */   /* (a column the model sorts needs no sort of the report's: it follows the model) */
      () => `G3: a sorted month name on the tooltip keeps its 12 months in the model's order: ${JSON.stringify(trend.map((v) => ({ f: filtersOf(v), s: v.visual.query.sortDefinition, h: v.page.height }))).slice(0, 400)} ${short(x)}`);
    // G13: a page without a chart gets no note about blank categories
    const t = await ask('create_report', { path: 'i-hr', name: 'I HR table', fields: { kpis: ['Hires[Hires]'], table: ['Hires[Department]', 'Hires[Hires]'] }, noDataMessage: false,
      pages: [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 24, y: 12, w: 600, h: 40 }, { kind: 'table', x: 24, y: 80, w: 600, h: 400 }] }] });
    chk(() => !t.err && !JSON.stringify(t.j.reportNotes || []).includes('blank category'), () => `G13: no chart, no note about blank categories: ${short(t)}`);
  }

  // ---------- G5: the approved plan's fields are the report's ----------
  {
    const pl = await ask('plan_layout', { layout: 'exec', path: 'i-hr', planFields: { kpis: ['Hires[Hires]'], measure: 'Hires[Hires]' }, name: 'I same', noDataMessage: false, secondPage: false }, raw), pid = pl.j && pl.j.plan && pl.j.plan.planId;
    await ask('approve_plan', { planId: pid }, raw);
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
    // (Q1 T-4, 0.3.1: txt was computed and never read) no part of check_report's answer names a visual by its title: the
    // titles the report holds (the writer titles from the fields, so the planted ones above never reach it), those of more
    // than one word (a one-word title can be a field's own name, which the answer may give)
    const titlesIn = (dir) => { const out = []; const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (e.name === 'visual.json') { const t = ((JSON.parse(fs.readFileSync(p, 'utf8')).visual || {}).visualContainerObjects || {}).title; (t || []).forEach((x) => { const v = x && x.properties && x.properties.text && x.properties.text.expr && x.properties.text.expr.Literal && x.properties.text.expr.Literal.Value; if (typeof v === 'string') out.push(v.replace(/^'|'$/g, '')); }); } }); walk(dir); return out; };
    const held = x.err ? [] : titlesIn(path.join(ROOT, 'i-ship', x.j.report)).filter((t) => /\s/.test(t.trim()));
    chk(() => !c.err && held.length >= 1 && held.every((t) => !txt.includes(t)), () => `R5: no part of check_report's answer names a visual by its title: ${held.filter((t) => txt.includes(t)).join(' | ') || `(${held.length} titles of more than one word)`}`);
  }

  // ---------- G7: one calm brand palette, in the design engine ----------
  {
    const E = req('../assets/js/design-engine.js');
    // P1+ (LAB-POLISH section 5, 12 Oct): a light design's page is a 6% tint of the lead, here the brand
    const t = await ask('generate_theme', { brand: '#7a2e8c' }), d = t.j && t.j.design;
    chk(() => typeof E.calmPalette === 'function' && JSON.stringify(d.data) === JSON.stringify(E.calmPalette('#7a2e8c', d.ui.card, d.ui.text)) && JSON.stringify(Object.assign({}, d.ui, { accent: null })) === JSON.stringify(Object.assign({}, E.PRESETS.Corporate.ui, { accent: null, background: E.mix(E.PRESETS.Corporate.ui.card, '#7a2e8c', 0.06) })),
      () => `G7: the MCP's brand palette is the design engine's calmPalette, on the Corporate light page: ${JSON.stringify(d && { data: d.data, ui: d.ui })}`);
  }

  // ---------- duplicates the gate block owns: one DAX for a visual's value, one Arabic month list, one custom-visual test ----------
  {
    // (0.2.9, the writer's A3-12: the writer is five files since, pbip-export.js and its modules; AGG_DAX is in pbip-query.js)
    const px = ['pbip-export', 'pbip-query', 'pbip-sizing', 'pbip-page', 'pbip-notes'].map((f) => path.join(REPO, 'assets/js', f + '.js')).filter((f) => fs.existsSync(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n'), Px = req('../assets/js/pbip-export.js');
    const twin = twinSource(), cr = fs.readFileSync(path.join(HERE, 'lib/check-report.mjs'), 'utf8'), plans = fs.readFileSync(path.join(HERE, 'lib/plans.mjs'), 'utf8');
    chk(() => (px.match(/const AGG_DAX = /g) || []).length === 1, () => `G4: one AGG_DAX in the writer: ${(px.match(/const AGG_DAX = /g) || []).length}`);
    chk(() => Array.isArray(Px.AR_MONTHS) && Px.AR_MONTHS.length === 12 && !/const MONTHS_AR = \[/.test(twin) && /AR_MONTHS/.test(twin), () => 'one Arabic month list: the writer exports AR_MONTHS and the twin uses it');
    // (Q1 T-5, 0.3.1: the check above passes on the name alone; the twin declares AR_MONTHS and writes its month column
    // from arabic-calendar.js's MONTHS) the months the twin writes are the writer's, word for word
    chk(() => { const C = req('../assets/js/arabic-calendar.js'); return C.MONTHS.length === 12 && C.MONTHS.join() === Px.AR_MONTHS.join() && /ArabicCal\.columnsFor/.test(twin); }, () => `one Arabic month list: the twin's month column (arabic-calendar.js MONTHS) names the months as the writer's AR_MONTHS: ${req('../assets/js/arabic-calendar.js').MONTHS.join()} / ${Px.AR_MONTHS.join()}`);
    chk(() => !/\^\[a-z\]\[A-Za-z\]\*\$/.test(cr) && /isCustom/.test(cr), () => 'one custom-visual test: check_report imports the reading block\'s isCustom');
    chk(() => !/export function approvedFor/.test(plans), () => 'G12: no unused approvedFor');
  }

  // ---------- round 11 (RESCORE-4 on rc.6: F4 worse in the written report, "50.87KAED", "-50.87MA..."): the card create_report
  // WRITES for a text-suffix format has no labelPrecision (N8-LAB setting B: "-51K AED", the space kept); checked on the
  // written visual.json, through the server's own field resolution (the round-10 check went straight through the writer) ----------
  {
    model('i-aed', [{ name: 'Sales', partitions: mp('Sales'), columns: [col('Amount', 'double'), col('Region', 'string')],
      measures: [ms('Margin AED', 'SUM ( Sales[Amount] )', '#,0 "AED";-#,0 "AED"'), ms('Revenue EUR', 'SUM ( Sales[Amount] )', '€#,0'), ms('Orders', 'COUNTROWS ( Sales )', '#,0')] }]);
    const pl = await ask('plan_layout', { layout: 'exec', kpis: 3 }), x = await ask('create_report', { path: 'i-aed', name: 'I AED', design: pl.j && pl.j.design, secondPage: false, noDataMessage: false, fields: { kpis: ['Sales[Margin AED]', 'Sales[Revenue EUR]', 'Sales[Orders]'], measure: 'Sales[Revenue EUR]', category: 'Sales[Region]' } });
    const cardOf = (m) => visualsOf(x, 'i-aed').find((v) => v.page.type !== 'Tooltip' && v.visual && v.visual.visualType === 'cardVisual' && JSON.stringify(v.visual.query || '').includes('"' + m + '"'));
    const def = (v) => ((((v && v.visual.objects.value) || []).find((e) => e.selector && e.selector.id === 'default')) || { properties: {} }).properties;
    const aed = cardOf('Margin AED'), eur = cardOf('Revenue EUR');
    chk(() => !x.err && aed && !('labelPrecision' in def(aed)) && !JSON.stringify(aed.visual.objects.value).includes('customFormatString') && eur && def(eur).labelPrecision,
      () => `round 11, F4: the written AED card has no decimals set and no format of its own (automatic units); the EUR card keeps its 2 decimals: ${short(x)} ${JSON.stringify([aed && aed.visual.objects.value, eur && def(eur)])}`);
  }

  // ---------- P2 (LAB-POLISH): through create_report, the written line 3 wide; smooth only with smoothLines; the donut's ring at 68 ----------
  {
    const one = async (name, extra) => { const pl = await ask('plan_layout', { layout: 'exec', kpis: 3 }); return ask('create_report', Object.assign({ path: 'i-hr', name, design: pl.j && pl.j.design, secondPage: false, noDataMessage: false, fields: { kpis: ['Hires[Hires]'], measure: 'Hires[Hires]', timeAxis: 'Calendar[Month Name]', category: 'Hires[Department]' } }, extra || {})); };
    // (L1, 19 Oct: smooth with markers is the default now; smoothLines false keeps the straight line)
    const a = await one('I P2', { smoothLines: false }), b = await one('I P2 smooth');
    const ls = (x) => { const v = visualsOf(x, 'i-hr').find((w) => w.visual && w.visual.visualType === 'lineChart'); return v ? (((v.visual.objects || {}).lineStyles || [])[0] || {}).properties : null; };
    const dn = (x) => visualsOf(x, 'i-hr').filter((w) => w.visual && w.visual.visualType === 'donutChart' && w.page.type !== 'Tooltip').map((w) => JSON.stringify(((w.visual.objects || {}).slices || [])[0] || null));
    const L = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : null);
    chk(() => !a.err && !b.err && ls(a) && L(ls(a).strokeWidth) === '3D' && !ls(a).lineChartType && ls(b) && L(ls(b).lineChartType) === "'smooth'" && dn(a).every((d) => /"68L"/.test(d)),
      () => `P2 through create_report: line 3 wide, smooth by default, straight with smoothLines false, every donut's ring at 68: ${short(a)} ${JSON.stringify([ls(a), ls(b), dn(a)])}`);
  }

  // ---------- P3 (LAYOUT-SWEEP-RC7, the laptop: a column "Agent" on two tables; Desktop: "Something's wrong with one or more
  // filters" on 2 of 6 tiles, though check_report, the validator and the lint said clean): every report-level measure name is
  // unique across the WHOLE report (Power BI's rule for measures, compared without case), not per table; each visual's
  // reference finds its measure; the validator says 0 errors ----------
  {
    model('i-two', [
      { name: 'Calls', partitions: mp('Calls'), columns: [col('Agent', 'string'), col('Duration', 'double'), col('Channel', 'string')],
        measures: [ms('Calls', 'COUNTROWS ( Calls )', '#,0'), ms('Talk Time', 'SUM ( Calls[Duration] )', '#,0')] },
      { name: 'Tickets', partitions: mp('Tickets'), columns: [col('Agent', 'string'), col('Status', 'string')],
        measures: [ms('Tickets', 'COUNTROWS ( Tickets )', '#,0'), ms('Keep: Calls by Agent', '1', '#,0')] }]);
    for (const layout of ['ops', 'exec']) {
      const pl = await ask('plan_layout', { path: 'i-two', layout });
      const x = await ask('create_report', { path: 'i-two', name: 'I two ' + layout, design: pl.j && pl.j.design, secondPage: true, fields: { kpis: ['Calls[Calls]', 'Tickets[Tickets]', 'Calls[Talk Time]'], measure: 'Calls[Calls]', category: 'Calls[Agent]', category2: 'Tickets[Agent]' } });
      const extP = x.err ? null : path.join(ROOT, 'i-two', x.j.report, 'definition', 'reportExtensions.json');
      const ents = extP && fs.existsSync(extP) ? JSON.parse(fs.readFileSync(extP, 'utf8')).entities : [];
      const names = ents.flatMap((e) => e.measures.map((m) => ({ t: e.name, m: m.name })));
      const lower = names.map((n) => n.m.toLowerCase()), dup = lower.filter((n, i) => lower.indexOf(n) !== i);
      const modelTaken = names.filter((n) => n.m.toLowerCase() === 'keep: calls by agent');   /* (a model measure's name, on any table: measure names are unique across the model) */
      const refs = []; JSON.stringify(visualsOf(x, 'i-two'), (k, v) => { if (v && v.Measure && v.Measure.Expression && v.Measure.Expression.SourceRef && v.Measure.Expression.SourceRef.Schema === 'extension') refs.push({ t: v.Measure.Expression.SourceRef.Entity, m: v.Measure.Property }); return v; });
      const broken = refs.filter((r) => !names.some((n) => n.t === r.t && n.m === r.m));
      const ck = await ask('check_report', { path: `i-two/I two ${layout}.pbip` }), errors = ck.j ? (ck.j.findings || []).filter((f) => f.severity === 'error') : null;
      chk(() => !x.err && names.length > 0 && !dup.length && !modelTaken.length && !broken.length && errors && errors.length === 0,
        () => `P3 (${layout}): report measure names unique across the report (no case), never a model name, every reference found, validator 0 errors: dup ${JSON.stringify(dup)} model ${JSON.stringify(modelTaken)} broken ${JSON.stringify(broken.slice(0, 3))} errors ${JSON.stringify(errors && errors.slice(0, 2))} ${short(x)}`);
    }
  }

  // ---------- P3 item 2 (LAYOUT-SWEEP-RC7, Arabic R1): the title words "by" and "detail" come from texts(lang), one source for
  // the designed and the hand path; a title takes them in its own script (round 14: one script a title), so an Arabic report
  // with Arabic names has no English "by" or "detail", and an Arabic report on English names reads the same on both paths ----------
  {
    model('i-ar', [{ name: 'Projects', partitions: mp('Projects'), columns: [col('Budget', 'double'), col('Product', 'string'), col('Region', 'string')],
      measures: [ms('Total Budget', 'SUM ( Projects[Budget] )', '#,0'), ms('Projects', 'COUNTROWS ( Projects )', '#,0')] }]);
    const AR = { 'Projects[Total Budget]': 'إجمالي الميزانية', 'Projects[Projects]': 'المشاريع', 'Projects[Product]': 'المنتج', 'Projects[Region]': 'المنطقة' };
    const F = { kpis: ['Projects[Total Budget]', 'Projects[Projects]'], measure: 'Projects[Total Budget]', category: 'Projects[Product]', category2: 'Projects[Region]', table: ['Projects[Region]', 'Projects[Total Budget]'] };
    const titles = (x, dir) => visualsOf(x, dir || 'i-ar').filter((v) => v.visual && v.page.type !== 'Tooltip').map((v) => { const t = ((v.visual.visualContainerObjects || {}).title || [])[0]; const val = t && t.properties.text && t.properties.text.expr.Literal ? t.properties.text.expr.Literal.Value : ''; return String(val).replace(/^'|'$/g, ''); }).filter(Boolean);
    const designed = async (name, extra, dir) => { const pl = await ask('plan_layout', { path: dir || 'i-ar', layout: 'exec', lang: 'ar' }); return ask('create_report', Object.assign({ path: dir || 'i-ar', name, lang: 'ar', design: pl.j && pl.j.design, secondPage: true, fields: F }, extra || {})); };
    const handPages = [{ name: 'P', width: 1280, height: 720, slots: [{ kind: 'title', x: 36, y: 18, w: 840, h: 48 }, { kind: 'bar', x: 36, y: 100, w: 600, h: 280 }, { kind: 'table', x: 660, y: 100, w: 580, h: 280 }] }];
    const hand = async (name, extra, dir) => ask('create_report', Object.assign({ path: dir || 'i-ar', name, lang: 'ar', pages: handPages, fields: F }, extra || {}));
    const dAr = await designed('I ar names', { displayNames: AR }), hAr = await hand('I ar hand names', { displayNames: AR });
    const EN = /\b(by|detail)\b/;
    chk(() => !dAr.err && titles(dAr).length && !titles(dAr).some((t) => EN.test(t)) && titles(dAr).some((t) => /حسب/.test(t)) && !titles(hAr).some((t) => EN.test(t)),
      () => `P3-2: an Arabic report with Arabic names: "حسب" and no English "by"/"detail", designed and hand: ${short(dAr)} ${JSON.stringify([titles(dAr), titles(hAr)])}`);
    // English names in an Arabic report: one script a title (round 14), the same words on the designed path as on the hand one
    // (0.3.0 J18, changed on purpose: the Arabic names approved above for 'i-ar' are its confirmed terms in this session and
    // are reused there; "English names" is a model with no approved terms: the same model in its own folder)
    model('i-ar-en', [{ name: 'Projects', partitions: mp('Projects'), columns: [col('Budget', 'double'), col('Product', 'string'), col('Region', 'string')],
      measures: [ms('Total Budget', 'SUM ( Projects[Budget] )', '#,0'), ms('Projects', 'COUNTROWS ( Projects )', '#,0')] }]);
    const dEn = await designed('I ar en', null, 'i-ar-en'), hEn = await hand('I ar hand en', null, 'i-ar-en');
    const words = (ts) => [...new Set(ts.flatMap((t) => (t.match(/\b(by|detail)\b|حسب|التفاصيل/g) || [])))].sort().join();
    chk(() => !dEn.err && !hEn.err && words(titles(dEn, 'i-ar-en')) && words(titles(dEn, 'i-ar-en')).split(',').every((w) => words(titles(hEn, 'i-ar-en')).split(',').includes(w) || w === 'detail'),
      () => `P3-2: English names in an Arabic report, designed and hand paths, the same title words: ${JSON.stringify([words(titles(dEn, 'i-ar-en')), words(titles(hEn, 'i-ar-en'))])}`);
    // the source: texts(lang) holds by and newDesign; the server passes it as it is on both paths. "detail" is the writer's
    // own word, chosen by the title's script (pbip-page.js), not in the design engine's labels: the reviewer's (b), 13 Oct,
    // so the design-engine fixtures (which record those labels) stay as they are
    const srv = serverSource(), E = createRequire(import.meta.url)('../assets/js/design-engine.js');
    const pgSrc = fs.readFileSync(path.join(REPO, 'assets/js/pbip-page.js'), 'utf8');
    chk(() => E.texts('ar').by === 'حسب' && E.texts('ar').newDesign === 'تصميم جديد' && E.texts('en').by === 'by' && !('detail' in E.texts('ar')) && !('detail' in E.texts('en')) && pgSrc.includes("'التفاصيل'") && !/texts: Object\.assign\(\{\}, texts\(a\.lang\)/.test(srv),
      () => `P3-2: by and newDesign in texts(lang), used as they are on both paths; detail the writer's own: ${JSON.stringify([E.texts('ar'), E.texts('en')].map((t) => [t.by, t.detail, t.newDesign]))}`);
  }

  // ---------- P3-3 N21: a table's rows by the font the report writes (N21-LAB, Desktop 2.158, 13 Oct 2026) ----------
  {
    const Z = req('../assets/js/pbip-sizing.js'), SB = 'Segoe UI Semibold', RG = 'Segoe UI';
    const near = (a, b) => Math.abs(a - b) < 0.05;
    // the whole rows a table h high shows (title, header, rows, the pinned total), at the default row padding
    const rowsIn = (h, t, title, font) => Math.floor((h - Z.tableHeight(0, t, title, 1, t, font)) / Z.rowPitch(t, 1));
    // the measured pitch, max(2t, t + 10): the same in both faces
    chk(() => [[8, 18], [9, 19], [10, 20], [15, 30]].every(([t, p]) => near(Z.rowPitch(t, 1), p)),
      () => `P3-3: the row pitch is the measured max(2t, t + 10): ${JSON.stringify([8, 9, 10, 15].map((t) => Z.rowPitch(t, 1)))}`);
    // the measured heights that hold N rows whole: Semibold 134.2 + 30N (15pt), 93.3 + 20N (10pt); regular 130.2 + 30N, 91.3 + 20N
    chk(() => [0, 5, 10].every((n) => near(Z.tableHeight(n, 15, 18, 1, 15, SB), 134.2 + 30 * n) && near(Z.tableHeight(n, 10, 12, 1, 10, SB), 93.3 + 20 * n)
      && near(Z.tableHeight(n, 15, 18, 1, 15, RG), 130.2 + 30 * n) && near(Z.tableHeight(n, 10, 12, 1, 10, RG), 91.3 + 20 * n)),
      () => `P3-3: the measured heights by face: ${JSON.stringify([SB, RG].map((f) => [Z.tableHeight(0, 15, 18, 1, 15, f), Z.tableHeight(0, 10, 12, 1, 10, f)]))}`);
    // rc.9's slots: Semibold 15pt in 307 shows 5 whole rows (the writer counted 6), 10pt in 167 shows 3 (it counted 4); 8pt in 253 about 9 (it counted 11)
    chk(() => rowsIn(307, 15, 18, SB) === 5 && rowsIn(167, 10, 12, SB) === 3 && rowsIn(253, 8, 12, RG) === 9 && rowsIn(253, 8, 12, SB) === 9,
      () => `P3-3: whole rows in rc.9's slots: ${JSON.stringify([rowsIn(307, 15, 18, SB), rowsIn(167, 10, 12, SB), rowsIn(253, 8, 12, RG), rowsIn(253, 8, 12, SB)])} (want 5, 3, 9, 9)`);
    // regular is its own (not Semibold's): a 310.2 slot holds 6 regular rows at 15pt, 5 Semibold; a font never measured takes regular's numbers
    chk(() => rowsIn(310.2, 15, 18, RG) === 6 && rowsIn(310.2, 15, 18, SB) === 5 && near(Z.tableHeight(4, 10, 12, 1, 10, 'Arial'), Z.tableHeight(4, 10, 12, 1, 10, RG)),
      () => `P3-3: regular apart from Semibold: ${JSON.stringify([rowsIn(310.2, 15, 18, RG), rowsIn(310.2, 15, 18, SB)])}`);
    // the writer: a Semibold report's tables end on whole rows by Semibold's numbers, and its total is bold by the full font string
    model('i-n21', [{ name: 'Loans', partitions: mp('Loans'), columns: [col('Branch', 'string'), col('Product', 'string'), col('Amount', 'double'), col('Risk', 'double')],
      measures: [ms('Total Loans', 'SUM ( Loans[Amount] )', '#,0'), ms('Avg Risk', 'AVERAGE ( Loans[Risk] )', '0.0'), ms('Loan Count', 'COUNTROWS ( Loans )', '#,0')] }]);
    const BOLD = "'Segoe UI Bold', wf_segoe-ui_bold, helvetica, arial, sans-serif";
    const build = async (font, page, filters) => { const pl = await ask('plan_layout', { path: 'i-n21', layout: 'exec', page, kpis: 3, filters, lang: 'en' }); if (pl.err) return pl;
      return ask('create_report', { path: 'i-n21', name: 'N21 ' + font + ' ' + page, design: Object.assign({}, pl.j.design, { font }), lang: 'en' }); };
    const themeOf = (x) => { const R = path.join(ROOT, 'i-n21', x.j.report, 'StaticResources', 'RegisteredResources'); return JSON.parse(fs.readFileSync(path.join(R, fs.readdirSync(R).find((f) => f.endsWith('.json'))), 'utf8')); };
    const sb = await build(SB, '1920x1080', 'none'), rg = await build(RG, '1920x1080', 'none');
    const tables = (x) => visualsOf(x, 'i-n21').filter((v) => v.visual && v.visual.visualType === 'tableEx' && !(((v.visual.objects || {}).grid || [])[0] || {}).properties?.imageHeight);
    // a capped table's height is its whole rows by the face's numbers: (h - fixed) / pitch is whole, within the 1 the height is rounded up by
    const whole = (x, fixed) => tables(x).length && tables(x).every((v) => { const r = (v.position.height - fixed) / 30; return r - Math.floor(r) < 1 / 30 + 1e-9 || v.position.height < fixed; });
    chk(() => !sb.err && !rg.err && whole(sb, 134.2) && whole(rg, 130.2),
      () => `P3-3: the written tables end on whole rows by their face (Semibold 134.2 + 30N, regular 130.2 + 30N): ${sb.err ? short(sb) : JSON.stringify(tables(sb).map((v) => v.position.height))} / ${rg.err ? short(rg) : JSON.stringify(tables(rg).map((v) => v.position.height))}`);
    chk(() => !sb.err && (themeOf(sb).textClasses.boldLabel || {}).fontFace === BOLD && !(themeOf(rg).textClasses || {}).boldLabel,
      () => `P3-3: a Semibold report's totals bold by the full string (textClasses.boldLabel); a regular one left to Power BI: ${sb.err ? short(sb) : JSON.stringify([themeOf(sb).textClasses.boldLabel, themeOf(rg).textClasses.boldLabel])}`);
    // both height rules take the written font (pbip-page.js)
    const pg3 = fs.readFileSync(path.join(REPO, 'assets/js/pbip-page.js'), 'utf8');
    chk(() => (pg3.match(/tableHeight\([^;]*\.fontFace \|\| font\)/g) || []).length >= 2, () => 'P3-3: both table height rules in pbip-page.js pass the font the report writes');
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
