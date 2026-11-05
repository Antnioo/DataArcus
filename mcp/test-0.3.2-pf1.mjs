// 0.3.2 PF1 (B-381, the laptop's look032 C, 5 Nov; written red first): plan_layout with planFields.measure
// Sales[Total Sales] and no KPI cards (planFields.kpis []), approve_plan, create_report wrote every chart and the table
// with "Sum of Amount" (0 projections named Total Sales, 11 named Amount): the person chose a measure and it was not
// used. Cause: mcp/lib/report-bind.mjs fieldBinding took the report's usable measures from planFields.kpis whenever
// it was given, so an empty list read as "the model has no measures" and the counted columns (Bind.counts) took
// every value. Now the report's measures are the plan's cards, else the plan's measure, else the picker's.
//   R1  the pinned input (L-1105-09): the made-up "Time Lab" model, the brief's plan_layout input (exec, kpis 0, no
//       filters, planFields measure, timeAxis, category, category2) with planFields.kpis [], and the swapped run:
//       every written value projection is Sales[Total Sales], none a column summed or counted
//   R2  each other key given is the one written: timeAxis on the trend, category and category2 on charts
//   R3  the brief's input without planFields.kpis (as before), and kpis, table and slicers given: written as given
//   R4  a chosen field that cannot be used is said before Approve (planProblems, no planId): a missing measure,
//       a column as the measure, a measure as an axis
//   R5  a text measure as the only KPI: no card for it (as before, said), and the charts keep the plan's measure
// Fixture: made up in a temporary folder (no employer data).   node test-0.3.2-pf1.mjs
import './test-env.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { serverClient } from './test-0.2.9.mjs';

const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x && x.err ? String(x.t).slice(0, 400) : JSON.stringify(x && x.j).slice(0, 400));

const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-pf1-')));
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const col = (name, dataType, x) => Object.assign({ name, dataType, sourceColumn: name }, x || {});
const model = (dir, extra) => { fs.mkdirSync(path.join(ROOT, dir, 'Time Lab.SemanticModel'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, dir, 'Time Lab.SemanticModel/model.bim'), JSON.stringify({ compatibilityLevel: 1567, model: { tables: [
    { name: 'Sales', partitions: mp('Sales'), columns: [col('FiscalYear', 'string'), col('Qtr', 'string'), col('Amount', 'double', { summarizeBy: 'sum' })],
      measures: [{ name: 'Total Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' }].concat(extra || []) },
    { name: 'المبيعات', partitions: mp('المبيعات'), columns: [col('شهر', 'string', { sortByColumn: 'رقم الشهر' }), col('رقم الشهر', 'int64'), col('المبلغ', 'double', { summarizeBy: 'sum' })],
      measures: [{ name: 'إجمالي المبيعات', expression: "SUM ( 'المبيعات'[المبلغ] )", formatString: '#,0' }] }] } })); };
const walk = (d) => (fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)])) : []);
// every written visual: its type, its category fields and its value fields (Table[Field], "Sum(T[c])" for an aggregation)
const nameOf = (f) => (f.Measure ? `${f.Measure.Expression.SourceRef.Entity}[${f.Measure.Property}]` + (f.Measure.Expression.SourceRef.Schema ? ' (report)' : '')
  : f.Column ? `${f.Column.Expression.SourceRef.Entity}[${f.Column.Property}]`
  : f.Aggregation ? `Agg(${f.Aggregation.Expression.Column.Expression.SourceRef.Entity}[${f.Aggregation.Expression.Column.Property}])` : '?');
const visualsOf = (dir) => walk(path.join(ROOT, dir)).filter((f) => /visual\.json$/.test(f)).map((f) => { const v = JSON.parse(fs.readFileSync(f, 'utf8')).visual || {}, qs = (v.query && v.query.queryState) || {};
  const role = (r) => ((qs[r] && qs[r].projections) || []).map((p) => nameOf(p.field));
  const all = [...role('Y'), ...role('Values'), ...role('Data')];
  const cols = new Set(['Y', 'Values', 'Data'].flatMap((r) => ((qs[r] && qs[r].projections) || []).filter((p) => p.field.Column).map((p) => nameOf(p.field))));
  return { type: v.visualType, cats: [...role('Category'), ...role('Rows'), ...cols], values: all.filter((x) => !cols.has(x)) }; });
const CHARTS = ['clusteredBarChart', 'clusteredColumnChart', 'lineChart', 'tableEx', 'barChart', 'columnChart', 'areaChart'];
const s = await serverClient(ROOT, {});
const run = async (dir, args) => { const pl = await s.call('plan_layout', Object.assign({ path: dir, layout: 'exec', kpis: 0, name: 'TL' }, args)); const id = !pl.err && pl.j.plan && pl.j.plan.planId;
  if (!id) return { pl, made: null, vis: [] };
  await s.call('approve_plan', { planId: id });
  const made = await s.call('create_report', { path: dir, planId: id });
  return { pl, made, vis: made.err ? [] : visualsOf(dir) }; };
try {
  const PF = { measure: 'Sales[Total Sales]', timeAxis: 'Sales[FiscalYear]', category: 'Sales[Qtr]', category2: 'المبيعات[شهر]' };
  const SWAP = { measure: 'Sales[Total Sales]', timeAxis: 'Sales[FiscalYear]', category: 'المبيعات[شهر]', category2: 'Sales[Qtr]' };
  // ---------- R1, R2: the pinned input and its swap, no KPI cards ----------
  for (const [label, dir, pf] of [['the brief\'s run', 'r1', PF], ['the swapped run', 'r1s', SWAP]]) {
    model(dir);
    const { pl, made, vis } = await run(dir, { planFields: Object.assign({ kpis: [] }, pf) });
    chk(() => made && !made.err, () => `R1 ${label}: planned, approved and written: ${made ? short(made) : short(pl)}`);
    const charts = vis.filter((v) => CHARTS.includes(v.type)), values = charts.flatMap((v) => v.values.filter((x) => !/ \(report\)$/.test(x)));
    const aggs = vis.flatMap((v) => v.values).filter((x) => /^Agg\(/.test(x));
    console.log(`  ${label}: ${values.filter((x) => x === 'Sales[Total Sales]').length} value projections Sales[Total Sales], ${aggs.length} columns summed or counted`);
    chk(() => charts.length >= 6 && values.length >= 9 && values.every((x) => x === 'Sales[Total Sales]'), () => `R1 ${label}: every chart's and table's value is the plan's measure Sales[Total Sales]: ${JSON.stringify(charts.map((v) => [v.type, v.values]))}`);
    chk(() => !aggs.length, () => `R1 ${label}: no column summed or counted in its place (the laptop saw "Sum of Amount"): ${JSON.stringify(aggs)}`);
    const catsOf = (t) => charts.filter((v) => t.test(v.type)).flatMap((v) => v.cats);
    chk(() => catsOf(/^lineChart$/).length && catsOf(/^lineChart$/).every((c) => c === pf.timeAxis), () => `R2 ${label}: the trend is over the plan's timeAxis ${pf.timeAxis}: ${JSON.stringify(catsOf(/^lineChart$/))}`);
    const used = new Set(charts.flatMap((v) => v.cats));
    chk(() => used.has(pf.category) && used.has(pf.category2), () => `R2 ${label}: category ${pf.category} and category2 ${pf.category2} are on the charts: ${JSON.stringify([...used])}`);
    chk(() => [...used].every((c) => [pf.timeAxis, pf.category, pf.category2].includes(c)), () => `R2 ${label}: no other category is written: ${JSON.stringify([...used])}`);
  }
  // ---------- R3: without planFields.kpis (as before); kpis, table and slicers given ----------
  {
    model('r3');
    const { made, vis } = await run('r3', { planFields: PF });
    const values = vis.filter((v) => CHARTS.includes(v.type)).flatMap((v) => v.values);
    chk(() => made && !made.err && values.length >= 9 && values.every((x) => x === 'Sales[Total Sales]'), () => `R3 the brief's input without planFields.kpis: the plan's measure everywhere: ${made ? short(made) : 'no plan'} ${JSON.stringify(values)}`);
  }
  {
    model('r3b');
    const { made, vis } = await run('r3b', { kpis: 1, filters: 'top', planFields: Object.assign({ kpis: ['المبيعات[إجمالي المبيعات]'], table: ['Sales[Qtr]', 'Sales[Total Sales]'], slicers: ['Sales[FiscalYear]'] }, PF) });
    const cards = vis.filter((v) => v.type === 'cardVisual' || v.type === 'card').flatMap((v) => v.values).filter((x) => !/ \(report\)$/.test(x));
    chk(() => made && !made.err && cards.includes('المبيعات[إجمالي المبيعات]'), () => `R3 planFields.kpis: the card shows the measure given: ${made ? short(made) : 'no plan'} ${JSON.stringify(cards)}`);
    const tables = vis.filter((v) => v.type === 'tableEx');
    chk(() => tables.length && tables.every((v) => JSON.stringify([...v.cats, ...v.values].filter((x) => !/ \(report\)$/.test(x)).sort()) === JSON.stringify(['Sales[Qtr]', 'Sales[Total Sales]'].sort())), () => `R3 planFields.table: the table holds the fields given: ${JSON.stringify(tables)}`);
    const slicers = vis.filter((v) => /slicer/i.test(v.type || '')).flatMap((v) => v.cats);
    chk(() => slicers.includes('Sales[FiscalYear]'), () => `R3 planFields.slicers: a slicer on the field given: ${JSON.stringify(vis.filter((v) => /slicer/i.test(v.type || '')))}`);
  }
  // ---------- R4: a chosen field that cannot be used is said before Approve ----------
  model('r4');
  for (const [what, pf, re] of [['a measure not in the model', { measure: 'Sales[Net Sales]' }, /Sales\[Net Sales\] is not in the model/],
    ['a column as the measure', { measure: 'Sales[Amount]' }, /Sales\[Amount\] is a column; a measure is needed/],
    ['a measure as an axis', { measure: 'Sales[Total Sales]', category: 'Sales[Total Sales]' }, /Sales\[Total Sales\] is a measure; a column is needed/]]) {
    const pl = await s.call('plan_layout', { path: 'r4', layout: 'exec', kpis: 0, name: 'TL', planFields: Object.assign({ kpis: [] }, pf) });
    chk(() => !pl.err && !(pl.j.plan && pl.j.plan.planId) && (pl.j.planProblems || []).some((p) => re.test(p)), () => `R4 ${what}: planProblems says it, and no planId: ${short(pl)}`);
  }
  // ---------- R5: a text measure as the only KPI ----------
  {
    model('r5', [{ name: 'Status', expression: '"On track"' }]);
    const { made, vis } = await run('r5', { kpis: 1, planFields: Object.assign({ kpis: ['Sales[Status]'] }, PF) });
    const values = vis.filter((v) => CHARTS.includes(v.type)).flatMap((v) => v.values);
    chk(() => made && !made.err && values.length >= 9 && values.every((x) => x === 'Sales[Total Sales]'), () => `R5 a text measure as the only KPI: the charts keep the plan's measure: ${made ? short(made) : 'no plan'} ${JSON.stringify(values)}`);
    chk(() => !vis.some((v) => v.values.includes('Sales[Status]')), () => 'R5 the text measure is never a card (as before)');
  }
} finally { await s.close(); fs.rmSync(ROOT, { recursive: true, force: true }); }

if (problems.length) { console.log(`FAIL script=mcp/test-0.3.2-pf1.mjs check="${problems[0].slice(0, 300).replace(/"/g, "'")}" cause=checks-failed`); problems.forEach((p) => console.log('  - ' + p.slice(0, 1500))); console.log(`FAIL  pf1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  pf1  ${checks} checks`);
