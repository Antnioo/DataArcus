import './test-env.mjs';
// 0.3.2 SP18 (the split: B-280, B-286; mcp/work/SP18.md). A characterisation suite for what a visual shows
// (mcp/lib/visual-meaning.mjs): the interpretation, the native candidates and the plan's entries for 27 made-up visuals
// are the ones recorded on the base (integration/0.3.2 aacd75b, before the role words and family hints moved to
// mcp/lib/visual-vocabulary.mjs). Recorded in fixtures/sp18-vocabulary.json (sha256 of each case's JSON);
// SP18_RECORD=1 records them again (only on the base, never to make a run pass); SP18_DUMP=<file> writes the JSON.
// Made-up visuals only.
//   M1  meaningOf: kind, native, confidence, why, roles, drill, series, lost, every flag
//   N1  nativeFor: kind, confidence, evidence, candidates in order with every refusal (fitsCapabilities' problems)
//   R1  replacementsOf on an inventory of the custom ones, and replacementLine of each entry
//   W1  wordsOf on 12 role names (camelCase, digits, spaces, capitals)
//   C1  the cases cover native and custom, ids with family words and none, to/target words, a network, a map without a
//       location, a donut with two categories, a package's display names, format objects
//   after the move: P1 the tables and helpers are visual-vocabulary.mjs's (re-exported as the same objects, the tables'
//   order kept);  P2 visual-meaning.mjs defines none of them
//   node test-0.3.2-sp18.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp18-vocabulary.json');
const M = await import('./lib/visual-meaning.mjs');

// ---------- the made-up visuals (the reading block's inventory shape) ----------
const HEX = '0123456789ABCDEF0123456789ABCDEF';
const c = (t, n, extra) => Object.assign({ kind: 'column', table: t, name: n, queryRef: `${t}.${n}` }, extra || {});
const m = (t, n) => ({ kind: 'measure', table: t, name: n, queryRef: `${t}.${n}` });
const agg = (t, n, a) => ({ kind: 'aggregation', table: t, name: n, agg: a, queryRef: `${a}(${t}.${n})` });
const TYPES = { 'Sales[Order Date]': 'dateTime', 'Sales[Ship Date]': 'dateTime', 'Plan[Start]': 'date', 'Plan[End]': 'date', 'Sales[Region]': 'string',
  'Geo[City]': 'string', 'Geo[Lat]': 'double', 'Geo[Lon]': 'double', 'Flow[From]': 'string', 'Flow[To]': 'string' };
const typeOf = (f) => TYPES[`${f.table}[${f.name}]`];
const FMT = { 'Sales.Margin %': '0.0%', 'Sales.Sales': '#,0', 'Sales.Target': '#,0' };
const formatOf = (f) => FMT[`${f.table}.${f.name}`];
// [id, type, fields, opts extra]
const CASES = [
  ['nativeColumn', 'clusteredColumnChart', { Category: [c('Sales', 'Region')], Y: [m('Sales', 'Sales')] }],
  ['nativePieTwo', 'pieChart', { Category: [c('Sales', 'Region'), c('Geo', 'City')], Y: [m('Sales', 'Sales')] }],
  ['nativeTable', 'tableEx', { Values: [c('Sales', 'Region'), m('Sales', 'Sales')] }],
  ['plainNoWords', 'vendorChartA' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales')] }],
  ['pieWord', 'acmePieChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales')] }],
  ['donutTwoCats', 'acmeDoughnut' + HEX, { Category: [c('Sales', 'Region'), c('Geo', 'City')], Values: [m('Sales', 'Sales')] }],
  ['donutTwoValues', 'ringChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales'), m('Sales', 'Target')] }],
  ['camelRoles', 'vendorVisualB' + HEX, { categoryAxis: [c('Sales', 'Region')], measureValues: [m('Sales', 'Sales')], seriesLegend: [c('Geo', 'City')] }],
  ['digitRoles', 'vendorVisualC' + HEX, { Values1: [m('Sales', 'Sales')], Values2: [m('Sales', 'Target')], Axis1: [c('Sales', 'Region')] }],
  ['y2Combo', 'comboPro' + HEX, { Category: [c('Sales', 'Order Date')], ColumnValues: [m('Sales', 'Sales')], LineValues: [m('Sales', 'Margin %')] }],
  ['targetMeasure', 'acmeGauge' + HEX, { Value: [m('Sales', 'Sales')], Target: [m('Sales', 'Target')], MinValue: [m('Sales', 'Low')], MaxValue: [m('Sales', 'High')] }],
  ['bulletTarget', 'bulletChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales')], TargetValue: [m('Sales', 'Target')] }],
  ['network', 'sankeyFlow' + HEX, { Source: [c('Flow', 'From')], Destination: [c('Flow', 'To')], Weight: [m('Flow', 'Volume')] }],
  ['networkNoWord', 'vendorVisualD' + HEX, { sourceNodes: [c('Flow', 'From')], targetNodes: [c('Flow', 'To')], linkValue: [m('Flow', 'Volume')] }],
  ['startEndValues', 'vendorVisualE' + HEX, { sourceNodes: [m('Sales', 'Sales')], targetNodes: [m('Sales', 'Target')], Details: [c('Sales', 'Region')] }],
  ['dateRange', 'ganttTimeline' + HEX, { Task: [c('Plan', 'Task')], StartDate: [c('Plan', 'Start')], EndDate: [c('Plan', 'End')] }],
  ['mapNoLocation', 'acmeMap' + HEX, { Values: [m('Sales', 'Sales')], Legend: [c('Sales', 'Region')] }],
  ['mapLatLon', 'geoPlot' + HEX, { Latitude: [c('Geo', 'Lat')], Longitude: [c('Geo', 'Lon')], Size: [m('Sales', 'Sales')] }],
  ['mapLocation', 'acmeMap2' + HEX, { Location: [c('Geo', 'City')], Size: [m('Sales', 'Sales')] }],
  ['timeLevels', 'vendorChartF' + HEX, { Axis: [c('Sales', 'Order Date', { level: 'Year' }), c('Sales', 'Order Date', { level: 'Month' })], Values: [agg('Sales', 'Amount', 'Sum')] }],
  ['kpiTrend', 'kpiIndicatorPlus' + HEX, { Indicator: [m('Sales', 'Sales')], Goal: [m('Sales', 'Target')], TrendLine: [c('Sales', 'Order Date')] }],
  ['slicerWord', 'chicletSlicer' + HEX, { Category: [c('Sales', 'Region')] }],
  ['tooltipsColorRule', 'vendorChartG' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales')], Tooltips: [m('Sales', 'Target')], ColorRule: [m('Sales', 'Margin %')] }],
  ['anonRolesPackage', 'vendorVisualH' + HEX, { measureRole7: [m('Sales', 'Sales')], groupRole3: [c('Sales', 'Region')] },
    { customRoles: [{ name: 'measureRole7', displayName: 'Values', kind: 'Measure' }, { name: 'groupRole3', displayName: 'Category', kind: 'Grouping' }] }],
  ['pieWithPackage', 'acmePie' + HEX, { Slices: [c('Sales', 'Region')], Amount: [m('Sales', 'Sales')] },
    { customRoles: [{ name: 'Slices', displayName: 'Category', kind: 'Grouping' }, { name: 'Amount', displayName: 'Values', kind: 'Measure' }] }],
  ['objectsDonut', 'vendorChartI' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales')] }, { customObjects: ['donutHole', 'labels'] }],
  ['matrixGrid', 'pivotGridPro' + HEX, { Rows: [c('Sales', 'Region'), c('Geo', 'City')], Values: [m('Sales', 'Sales'), m('Sales', 'Target')] }],
  ['unknownMixed', 'vendorThing' + HEX, { Stuff: [c('Sales', 'Region'), m('Sales', 'Sales')] }]
];
const NATIVES = ['nativeColumn', 'nativePieTwo', 'nativeTable'];
const optsOf = (x) => Object.assign({ typeOf, formatOf }, x[3] || {}, NATIVES.includes(x[0]) ? {} : { declared: new Set([x[1]]) });
const visualOf = (x, i) => ({ id: x[0], type: x[1], fields: x[2], x: 40 * i, y: 20, w: 400, h: 300, meaning: !NATIVES.includes(x[0]) });
const stable = (v) => JSON.stringify(v, (k, val) => (val instanceof Set ? [...val] : val));

const got = {};
CASES.forEach((x, i) => {
  const v = visualOf(x, i), o = optsOf(x);
  got[`M1:${x[0]}`] = stable(M.meaningOf(v, o));
  got[`N1:${x[0]}`] = stable(M.nativeFor(v, o));
});
const inv = { pages: [{ n: 1, name: 'P1', visuals: CASES.map(visualOf) }] };
const reps = M.replacementsOf(inv, { typeOf, formatOf });
got['R1:entries'] = stable(reps);
got['R1:lines'] = stable(reps.map(M.replacementLine));
const NAMES = ['ColumnValues', 'Y2', 'Trend Axis', 'Values1', 'sourceNodes', 'kpiValue', 'StartDate', 'measureRole7', 'XAxisLabels', 'target_value', 'HTMLContent', ''];
got['W1:words'] = stable(NAMES.map((s) => M.wordsOf(s)));

if (process.env.SP18_DUMP) fs.writeFileSync(process.env.SP18_DUMP, JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, v]) => [k, JSON.parse(v)])), null, 1) + '\n');
if (process.env.SP18_RECORD) {
  fs.writeFileSync(GOLD, JSON.stringify({ about: 'SP18: sha256 of each case\'s JSON, recorded on integration/0.3.2 aacd75b (before the vocabulary moved); test-0.3.2-sp18.mjs', cases: Object.fromEntries(Object.entries(got).map(([k, v]) => [k, sha(v)])) }, null, 1) + '\n');
}
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).cases;
const differ = (prefix) => Object.keys(got).filter((k) => k.startsWith(prefix)).filter((k) => gold[k] !== sha(got[k]));
const missing = Object.keys(gold).filter((k) => !(k in got));
chk(() => !missing.length && differ('M1:').length === 0, () => `M1: meaningOf differs from the base for ${differ('M1:').concat(missing).join(', ')}`);
chk(() => differ('N1:').length === 0, () => `N1: nativeFor (kind, confidence, evidence, candidates, refusals) differs from the base for ${differ('N1:').join(', ')}`);
chk(() => differ('R1:').length === 0, () => `R1: the plan's entries or lines differ from the base (${differ('R1:').join(', ')})`);
chk(() => differ('W1:').length === 0, () => 'W1: wordsOf splits role names differently from the base');
// C1: the cases cover what the brief names (read from the answers, not the case names)
const N = Object.fromEntries(CASES.map((x, i) => [x[0], M.nativeFor(visualOf(x, i), optsOf(x))]));
chk(() => N.nativeColumn.custom === false && N.network.kind === 'network' && N.network.native === null && N.donutTwoCats.candidates.some((k) => k.twoLevel)
  && N.mapNoLocation.native !== 'azureMap' && N.pieWord.kind === 'pie' && N.plainNoWords.kind !== 'pie' && Object.values(N).some((r) => r.custom && r.candidates.some((k) => !k.fits && k.problems.length))
  && Object.values(N).some((r) => r.confidence === 'high') && Object.values(N).some((r) => r.confidence === 'low') && reps.length === CASES.length - 3,
() => 'C1: the cases cover a native visual, a network, a donut by two categories, a refusal, high and low confidence and one entry per custom visual');

// ---------- after the move ----------
let V = null;
try { V = await import('./lib/visual-vocabulary.mjs'); } catch (e) { V = null; }
if (V) {
  chk(() => M.ROLE_WORDS === V.ROLE_WORDS && M.FAMILY_HINTS === V.FAMILY_HINTS && M.OBJECT_HINTS === V.OBJECT_HINTS && M.wordsOf === V.wordsOf
    && ['classOf', 'classesOf', 'hintsOf', 'objectHintOf'].every((k) => typeof V[k] === 'function') && V.TO_WORDS instanceof Set
    && Object.keys(V.ROLE_WORDS).join() === 'tooltip,colorRule,latitude,longitude,location,node,from,goal,min,max,indicator,breakdown,line,bar,series,x,y,size,rows,time,category,value'
    && Object.keys(V.FAMILY_HINTS).join() === 'donut,pie,combo,waterfall,time,network,gauge,kpi,map,scatter,matrix,table,slicer,card,area,line,column,bar',
  () => 'P1: the vocabulary module holds the tables and helpers, visual-meaning.mjs re-exports the same objects, the tables keep their order');
  const src = fs.readFileSync(path.join(HERE, 'lib', 'visual-meaning.mjs'), 'utf8');
  chk(() => !/(^|\n)\s*(export\s+)?(const|function|let)\s+(ROLE_WORDS|TO_WORDS|FAMILY_HINTS|OBJECT_HINTS|wordsOf|classOf|classesOf|hintsOf|objectHintOf)\b/.test(src) && /from '\.\/visual-vocabulary\.mjs'/.test(src),
  () => 'P2: visual-meaning.mjs imports the vocabulary and defines none of its tables or helpers');
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp18.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp18  ${checks - problems.length}/${checks} checks`); process.exit(1); }
console.log(`PASS  sp18  ${checks} checks`);
