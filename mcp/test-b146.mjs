// B-146, the aggregation guard (0.3): a ratio, an average, a distinct count or a rank is never stacked or summed, and a
// snapshot (a balance, a headcount, an inventory) summed over time is asked about, never changed silently. The classifier
// (assets/js/aggregation.js) reads metadata only (the DAX's shape, the format, the name) and never says a measure IS
// additive: what it can't tell is "unknown", and nothing changes for it. Written red first. Made-up models only.
//   node test-b146.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { serverClient } from './test-0.2.9.mjs';

const require = createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url)), REPO = path.join(HERE, '..');
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const short = (x) => (x.err ? x.t.slice(0, 500) : JSON.stringify(x.j).slice(0, 500));
let Agg = null;
try { Agg = require('../assets/js/aggregation.js'); } catch (e) { problems.push('B-146. assets/js/aggregation.js does not load: ' + String(e && e.message || e).slice(0, 160)); }

// ---------- a made-up model: the brief's five measures, one the classifier can't read, and a date table ----------
const col = (name, dataType, extra) => Object.assign({ name, dataType, sourceColumn: name }, extra || {});
const mp = (n) => [{ name: n, mode: 'import', source: { type: 'm', expression: 'let Source = #table({"A"}, {}) in Source' } }];
const MEASURES = [
  { name: 'Sales', expression: 'SUM ( Sales[Amount] )', formatString: '#,0' },
  { name: 'Margin %', expression: 'DIVIDE ( SUM ( Sales[Amount] ) - SUM ( Sales[Cost] ), SUM ( Sales[Amount] ) )', formatString: '0.0%' },
  { name: 'Avg Order Value', expression: 'AVERAGEX ( VALUES ( Sales[Order Id] ), [Sales] )', formatString: '#,0.00' },
  { name: 'Distinct Customers', expression: 'DISTINCTCOUNT ( Sales[Customer] )', formatString: '#,0' },
  { name: 'Balance', expression: 'SUM ( Sales[Account Balance] )', formatString: '#,0' },
  { name: 'Mystery', expression: '[Sales] * 2', formatString: '#,0' }
];
const bim = { name: 'Guard', compatibilityLevel: 1567, model: { culture: 'en-US', tables: [
  { name: 'Sales', columns: [col('Order Id', 'int64'), col('Region', 'string'), col('Customer', 'string'), col('Date', 'dateTime'), col('Amount', 'double'), col('Cost', 'double'), col('Account Balance', 'double')],
    measures: MEASURES, partitions: mp('Sales') },
  { name: 'Calendar', dataCategory: 'Time', columns: [col('Date', 'dateTime', { isKey: true }), col('Month', 'string', { sortByColumn: 'Month Number' }), col('Month Number', 'int64'), col('Year', 'int64')], partitions: mp('Calendar') }
], relationships: [{ name: 'r1', fromTable: 'Sales', fromColumn: 'Date', toTable: 'Calendar', toColumn: 'Date' }] } };
const ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-b146-'));
fs.mkdirSync(path.join(ROOT, 'Guard', 'Guard.SemanticModel'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'Guard', 'Guard.SemanticModel', 'model.bim'), JSON.stringify(bim));
fs.writeFileSync(path.join(ROOT, 'Guard', 'Guard.pbip'), JSON.stringify({ version: '1.0', artifacts: [{ report: { path: 'Guard.Report' } }] }));

// ---------- 1. classify: the class, its evidence, never "additive" ----------
if (Agg) {
  const ctx = { measures: MEASURES };
  const c = Object.fromEntries(MEASURES.map((m) => [m.name, Agg.classify(m, ctx)]));
  chk(() => c['Margin %'].class === 'non_additive' && c['Margin %'].confidence === 'high' && c['Margin %'].evidence.some((e) => e.kind === 'dax' && /DIVIDE/.test(e.says)), () => `classify. Margin % (DIVIDE) is non_additive, high, from the DAX: ${JSON.stringify(c['Margin %'])}`);
  chk(() => c['Avg Order Value'].class === 'non_additive' && c['Avg Order Value'].evidence.some((e) => e.kind === 'dax' && /AVERAGEX/.test(e.says)), () => `classify. Avg Order Value (AVERAGEX) is non_additive: ${JSON.stringify(c['Avg Order Value'])}`);
  chk(() => c['Distinct Customers'].class === 'non_additive' && c['Distinct Customers'].evidence.some((e) => /DISTINCTCOUNT/.test(e.says)), () => `classify. Distinct Customers (DISTINCTCOUNT) is non_additive: ${JSON.stringify(c['Distinct Customers'])}`);
  chk(() => c.Balance.class === 'semi_additive_time' && c.Balance.timeHandled === false && c.Balance.evidence.some((e) => e.kind === 'name'), () => `classify. Balance (a SUM, named as a snapshot) is semi_additive_time, not handled over time: ${JSON.stringify(c.Balance)}`);
  chk(() => c.Sales.class === 'unknown' && c.Mystery.class === 'unknown', () => `classify. Sales (SUM) and Mystery ([Sales] * 2) are unknown, never "additive": ${JSON.stringify([c.Sales, c.Mystery])}`);
  chk(() => !JSON.stringify(c).includes('"additive"'), () => 'classify. no answer says "additive"');
  // the time already handled in the DAX: no question to ask
  const closing = Agg.classify({ name: 'Closing Balance', expression: 'CALCULATE ( SUM ( Sales[Account Balance] ), LASTDATE ( Calendar[Date] ) )' }, ctx);
  chk(() => closing.class === 'semi_additive_time' && closing.timeHandled === true, () => `classify. a balance at LASTDATE is semi_additive_time, handled: ${JSON.stringify(closing)}`);
  // a measure that refers to a ratio is a ratio; a division inside SUMX is summed row by row (left alone)
  chk(() => Agg.classify({ name: 'Margin shown', expression: '[Margin %]' }, ctx).class === 'non_additive', () => 'classify. a measure that is [Margin %] is non_additive');
  chk(() => Agg.classify({ name: 'Line total', expression: 'SUMX ( Sales, Sales[Amount] / 2 )' }, ctx).class === 'unknown', () => 'classify. a division inside SUMX is summed row by row: unknown');
  // a ratio name with an additive DAX shape is not called a ratio (the DAX wins); with a DAX it can't read, the name speaks (medium)
  chk(() => Agg.classify({ name: 'Rate card total', expression: 'SUM ( Sales[Amount] )' }, ctx).class === 'unknown', () => 'classify. a SUM named "rate" is unknown (the DAX shape wins over the name)');
  const byName = Agg.classify({ name: 'Conversion Rate', expression: 'SWITCH ( TRUE (), 1, 2 )' }, ctx);
  chk(() => byName.class === 'non_additive' && byName.confidence === 'medium', () => `classify. a ratio name over DAX it can't read: non_additive, medium: ${JSON.stringify(byName)}`);
  // a column the visual sums (a model without measures): a snapshot column summed is asked about
  chk(() => Agg.classify({ column: 'Balance', agg: 'Sum' }).class === 'semi_additive_time' && Agg.classify({ column: 'Amount', agg: 'Sum' }).class === 'unknown', () => 'classify. a summed Balance column is semi_additive_time; a summed Amount unknown');
  // the guard: every stacked or area type Microsoft has is known to it (none is written today, test below)
  const VT = require('../assets/js/visual-types.js');
  const all = (VT.TYPES || VT.types || VT.VISUAL_TYPES || VT || []);
  const stackedNames = (Array.isArray(all) ? all : Object.keys(all)).filter((t) => /stacked|area|ribbon|waterfall/i.test(t));
  chk(() => stackedNames.length >= 5 && stackedNames.every((t) => Agg.STACKED.includes(t)), () => `guard. every stacked or area type is in Agg.STACKED: ${stackedNames.filter((t) => !Agg.STACKED.includes(t))}`);
  const page = (type) => ({ visuals: [{ type, fields: { Category: [{ kind: 'column', table: 'Sales', name: 'Region' }], Y: [{ kind: 'measure', table: 'Sales', name: 'Margin %' }] } }] });
  const g1 = Agg.guard(page('stackedColumnChart'), { measures: MEASURES, tables: bim.model.tables });
  chk(() => g1.problems.length === 1 && /Margin %/.test(g1.problems[0].en) && g1.problems[0].ar, () => `guard. a stacked column with Margin % is a plan problem (EN and AR): ${JSON.stringify(g1)}`);
  const g2 = Agg.guard(page('clusteredColumnChart'), { measures: MEASURES, tables: bim.model.tables });
  chk(() => g2.problems.length === 0, () => `guard. a clustered column with Margin % is no problem: ${JSON.stringify(g2)}`);
  // the writer writes no stacked type: its slot kinds' visual types
  const Q = require('../assets/js/pbip-query.js');
  chk(() => Object.values(Q.TYPES || {}).length > 5 && Object.values(Q.TYPES).every((t) => !Agg.STACKED.includes(t)), () => `guard. the report writer writes no stacked or area type: ${JSON.stringify(Q.TYPES)}`);
}

// ---------- 2. plan_layout: what the plan says (the page built as create_report writes it) ----------
{
  const s = await serverClient(ROOT);
  const plan = (pf, lang) => s.call('plan_layout', Object.assign({ path: 'Guard', layout: 'analysis', filters: 'none', planFields: pf }, lang ? { lang } : {}));
  // A: Sales on the trend, the ratios on cards and in the table: no question; the table's ratios said
  const A = await plan({ kpis: ['Sales[Sales]', 'Sales[Margin %]', 'Sales[Avg Order Value]', 'Sales[Distinct Customers]'], measure: 'Sales[Sales]', timeAxis: 'Calendar[Date]', category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Margin %]', 'Sales[Sales]'] });
  const ag = A.j && A.j.aggregation;
  chk(() => !A.err && ag && (ag.nonAdditive || []).some((x) => x.field === 'Sales[Margin %]' && /table/.test(x.in.join())) && /recalculat/.test(ag.sayInPlan) && /Margin %/.test(ag.sayInPlan), () => `plan. Margin % in the table: listed, and the plan says Power BI's total recalculates it: ${short(A)}`);
  chk(() => ag && !(ag.nonAdditive || []).some((x) => x.field === 'Sales[Sales]') && !(ag.pleaseConfirm || []).length, () => `plan. Sales is untouched and no question is asked: ${JSON.stringify(ag)}`);
  chk(() => A.j && A.j.plan && A.j.plan.planId, () => `plan. a plan with ratios still gets its plan id (nothing to refuse): ${short(A)}`);
  // B: Balance on the date axis: one question, never a change
  const B = await plan({ kpis: ['Sales[Sales]', 'Sales[Balance]'], measure: 'Sales[Balance]', timeAxis: 'Calendar[Date]', category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Sales]'] });
  const bq = B.j && B.j.aggregation && B.j.aggregation.pleaseConfirm;
  chk(() => !B.err && bq && bq.length === 1 && bq[0].field === 'Sales[Balance]' && /Should Balance be taken at the period end rather than summed over time\?/.test(bq[0].question), () => `plan. Balance on a date axis asks one question: ${short(B)}`);
  chk(() => B.j && B.j.plan && B.j.plan.planId && !(B.j.planProblems || []).length, () => `plan. the question changes nothing and refuses nothing: ${short(B)}`);
  const Bar = await plan({ kpis: ['Sales[Sales]', 'Sales[Balance]'], measure: 'Sales[Balance]', timeAxis: 'Calendar[Date]', category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Sales]'] }, 'ar');
  const aq = Bar.j && Bar.j.aggregation && Bar.j.aggregation.pleaseConfirm;
  chk(() => aq && aq.length === 1 && /[؀-ۿ]/.test(aq[0].question) && aq[0].question.includes('Balance'), () => `plan. the question in Arabic for an Arabic plan: ${JSON.stringify(aq)}`);
  // C: only measures it can't read: no aggregation section at all
  const C = await plan({ kpis: ['Sales[Mystery]', 'Sales[Sales]'], measure: 'Sales[Mystery]', timeAxis: 'Calendar[Date]', category: 'Sales[Region]', table: ['Sales[Region]', 'Sales[Mystery]'] });
  chk(() => !C.err && C.j && !('aggregation' in C.j), () => `plan. nothing is said for measures the guard can't read: ${short(C)}`);
  // what is written is unchanged: the same visual types as before for plan A's page
  chk(() => A.j && A.j.slots.every((x) => !x.plannedAs || x.plannedAs !== x.kind), () => 'plan. no slot changes kind for the guard');
  await s.close();
}

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL  b146  ${checks} checks, ${problems.length} failed`); problems.forEach((p) => console.log('      - ' + p)); process.exit(1); }
console.log(`PASS  b146  ${checks} checks`);
