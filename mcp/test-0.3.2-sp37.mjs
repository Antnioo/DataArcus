import './test-env.mjs';
// 0.3.2 SP37 (the split, finish: B-280, B-286; mcp/work/SP37.md). A characterisation suite for the parts of
// mcp/lib/visual-meaning.mjs that SP37 moves out (capability validation, candidate ranking, the replacement's disclosure
// in the plan): what nativeFor and replacementsOf answer for 15 made-up visuals, recorded on the base (integration/0.3.2
// c2dbd06, before any move) in fixtures/sp37-split.json (sha256 of each case's JSON). SP37_RECORD=1 records them again
// (only on the base, never to make a run pass); SP37_DUMP=<file> writes the JSON. sp18 keeps guarding its 27 cases.
// Made-up visuals only.
//   M1  meaningOf of each case;  N1 nativeFor (first option);  S1 nativeFor with second: true
//   R1  replacementsOf on an inventory of them (axes and panels in English and Arabic, second keys, factsOf,
//       categoryOf, calendarOf) and replacementLine of each entry
//   F1  fitsCapabilities on 8 role sets (fits, wrong kind, no such role, a required role missing, over a maximum)
//   X1  the exported tables and helpers (CONFIDENCE_LEVELS, AZURE_NEEDS, FORMS, NATIVE, shortType, pickOf,
//       ownSettingsSaid, typeOfModel, categoryOfModel, meaningInReport)
//   C1  the cases reach each branch the split moves (read from the answers)
//   after the moves: P1 visual-capabilities.mjs, P2 visual-candidates.mjs, P3 replacement-disclosure.mjs hold their
//   parts (visual-meaning.mjs re-exports the same objects and defines none of them); P4 every module's header says its
//   interface, every file under 600 lines
//   node test-0.3.2-sp37.mjs
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const sha = (t) => crypto.createHash('sha256').update(t).digest('hex');
const GOLD = path.join(HERE, 'fixtures', 'sp37-split.json');
const M = await import('./lib/visual-meaning.mjs');

// ---------- the made-up visuals (the reading block's inventory shape) ----------
const HEX = '0123456789ABCDEF0123456789ABCDEF';
const c = (t, n, extra) => Object.assign({ kind: 'column', table: t, name: n, queryRef: `${t}.${n}` }, extra || {});
const m = (t, n) => ({ kind: 'measure', table: t, name: n, queryRef: `${t}.${n}` });
const TYPES = { 'Sales[Order Date]': 'dateTime', 'Cal[Day]': 'dateTime', 'Geo[City]': 'string', 'Geo[Lat]': 'double', 'Geo[Lon]': 'double', 'Words[Word]': 'string' };
const typeOf = (f) => TYPES[`${f.table}[${f.name}]`];
const FMT = { 'Sales.Sales': '"$"#,0', 'Sales.Target': '"$"#,0', 'Sales.Units': '#,0', 'Sales.Margin %': '0.0%', 'Sales.Left': '#,0', 'Sales.Right': '#,0' };
const formatOf = (f) => FMT[`${f.table}.${f.name}`];
const CAL = { year: c('Cal', 'Year'), month: c('Cal', 'Month'), weekday: c('Cal', 'Weekday') };
const calendarOf = (f) => (f && f.table === 'Cal' ? CAL : null);
const CATS = { 'Geo[City]': '', 'Geo[Place]': 'City' };
const categoryOf = (f) => CATS[`${f.table}[${f.name}]`];
// [id, type, fields, visual extra, opts extra]
const CASES = [
  ['bullet', 'bulletChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales')], TargetValue: [m('Sales', 'Target')] }],
  ['calendar', 'calendarHeatmap' + HEX, { Date: [c('Cal', 'Day')], Values: [m('Sales', 'Units')] }, {}, { calendarOf }],
  ['calendarNone', 'calendarHeatmap2' + HEX, { Date: [c('Sales', 'Order Date')], Values: [m('Sales', 'Units')] }, {}, { calendarOf }],
  ['calendarNoFn', 'calendarHeatmap3' + HEX, { Date: [c('Sales', 'Order Date')], Values: [m('Sales', 'Units')] }],
  ['mapPlace', 'geoMapVisual' + HEX, { Location: [c('Geo', 'City')], Size: [m('Sales', 'Sales')] }, {}, { categoryOf }],
  ['mapLatLon', 'geoPlot' + HEX, { Latitude: [c('Geo', 'Lat')], Longitude: [c('Geo', 'Lon')], Size: [m('Sales', 'Sales')] }, {}, { categoryOf }],
  ['search', 'textFilter' + HEX, { field: [c('Sales', 'Product')] }, { h: 30 }],
  ['chips', 'pillButtons' + HEX, { Category: [c('Sales', 'Region')] }, { h: 40 }],
  ['cloud', 'wordCloud' + HEX, { Category: [c('Words', 'Word')], Values: [m('Sales', 'Units')] }],
  ['tornado', 'tornadoChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Left'), m('Sales', 'Right')] }, { customObjects: ['labels', 'categoryLabels', 'weekStartDay', 'bad name!'] },
    { facts: { valueLabels: true, categoryLabels: true, trend: true, thresholds: true } }],
  ['scatterLegend', 'scatterPlus' + HEX, { Category: [c('Sales', 'Region')], X: [m('Sales', 'Sales')], Y: [m('Sales', 'Units')], Legend: [c('Geo', 'City')] }, {}, { facts: { legend: false, trend: true } }],
  ['timeline', 'timelineChart' + HEX, { Axis: [c('Sales', 'Order Date', { level: 'Year' }), c('Sales', 'Order Date', { level: 'Quarter' })], Values: [m('Sales', 'Units')] }],
  ['helperSort', 'vendorBarChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales'), m('Sales', 'Margin %'), m('Sales', 'Units')] }, { sort: [{ field: c('Sales', 'Rank') }] }],
  ['pieSetAside', 'acmePieChart' + HEX, { Category: [c('Sales', 'Region')], Values: [m('Sales', 'Sales'), m('Sales', 'Units')] }, { sort: [{ field: c('Sales', 'Region') }] }],
  ['noFields', 'vendorThing' + HEX, { Values: [] }],
  ['group', 'group', {}]
];
const optsOf = (x) => Object.assign({ typeOf, formatOf, declared: new Set([x[1]]) }, x[4] || {});
const visualOf = (x, i) => Object.assign({ id: x[0], type: x[1], fields: x[2], x: 40 * i, y: 20, w: 400, h: 300, meaning: x[0] !== 'group' }, x[3] || {});
const stable = (v) => JSON.stringify(v, (k, val) => (val instanceof Set ? [...val] : val));

const got = {};
CASES.forEach((x, i) => {
  const v = visualOf(x, i), o = optsOf(x);
  got[`M1:${x[0]}`] = stable(M.meaningOf(v, o));
  got[`N1:${x[0]}`] = stable(M.nativeFor(v, o));
  got[`S1:${x[0]}`] = stable(M.nativeFor(v, Object.assign({}, o, { second: true })));
});
// the plan's entries: two pages (English, Arabic), the facts through factsOf, the second option for two of them
const vis = CASES.map((x, i) => Object.assign(visualOf(x, i), x[4] && x[4].facts ? { json: x[4].facts } : {}));
const inv = { pages: [{ n: 1, name: 'P1', visuals: vis.slice(0, 8) }, { n: 2, name: 'P2', visuals: vis.slice(8) }] };
const ropts = (lang, conf) => ({ typeOf, formatOf, calendarOf, categoryOf, factsOf: (j) => j, langOf: (p) => (p.n === 2 ? lang : 'en'), second: ['1:0,20', '1:240,20'], axes: conf });
const repsEn = M.replacementsOf(inv, ropts('en', {}));
const repsAr = M.replacementsOf(inv, ropts('ar', { confirmed: true }));
got['R1:en'] = stable(repsEn); got['R1:ar'] = stable(repsAr);
got['R1:lines'] = stable(repsEn.concat(repsAr).map(M.replacementLine));
// fitsCapabilities on role sets
const ROLESETS = [
  ['clusteredColumnChart', { Category: [c('S', 'R')], Y: [m('S', 'A')] }],
  ['clusteredColumnChart', { Category: [m('S', 'A')], Y: [c('S', 'R')] }],
  ['donutChart', { Category: [c('S', 'R'), c('S', 'Q')], Y: [m('S', 'A')] }],
  ['donutChart', { Category: [c('S', 'R')] }],
  ['azureMap', { Size: [m('S', 'A')] }],
  ['scatterChart', { Category: [c('S', 'R')], X: [m('S', 'A')], Y: [m('S', 'B')] }],
  ['pivotTable', { Rows: [c('S', 'R')], Nope: [m('S', 'A')] }],
  ['notAVisual', { Y: [m('S', 'A')] }]
];
got['F1:fits'] = stable(ROLESETS.map(([t, r]) => M.fitsCapabilities(t, r)));
const tables = [{ name: 'Geo', columns: [{ name: 'City', dataType: 'string', dataCategory: 'City' }, { name: 'Lat', dataType: 'double' }] }, { name: 'Bad', columns: null }];
got['X1:exports'] = stable({ levels: M.CONFIDENCE_LEVELS, needs: M.AZURE_NEEDS, forms: M.FORMS, native: M.NATIVE,
  short: ['bulletChart' + HEX, 'bad name' + HEX, '', null].map(M.shortType), pick: M.pickOf({ n: 3 }, { x: 1, y: 2 }),
  own: [M.ownSettingsSaid({ count: 1, named: ['labels'], kept: ['labels (as x)'] }), M.ownSettingsSaid({ count: 12, named: 'abcdefghij'.split(''), rest: 'abcdefghij'.split(''), hidden: 2 }), M.ownSettingsSaid({})],
  types: [M.typeOfModel(tables)(c('Geo', 'City')), M.typeOfModel(tables)(c('Geo', 'None')), M.typeOfModel(null)(null)],
  cats: [M.categoryOfModel(tables)(c('Geo', 'City')), M.categoryOfModel(tables)(c('Geo', 'Lat')), M.categoryOfModel(tables)(c('X', 'Y'))],
  inReport: [M.meaningInReport(visualOf(CASES[0], 0), { publicCustomVisuals: [CASES[0][1]] }, { typeOf }), M.meaningInReport({ type: 'clusteredColumnChart', fields: {} }, {}, {}), M.meaningInReport(null, {}, {})] });

if (process.env.SP37_DUMP) fs.writeFileSync(process.env.SP37_DUMP, JSON.stringify(Object.fromEntries(Object.entries(got).map(([k, v]) => [k, JSON.parse(v)])), null, 1) + '\n');
if (process.env.SP37_RECORD) {
  fs.writeFileSync(GOLD, JSON.stringify({ about: 'SP37: sha256 of each case\'s JSON, recorded on integration/0.3.2 c2dbd06 (before any SP37 move); test-0.3.2-sp37.mjs', cases: Object.fromEntries(Object.entries(got).map(([k, v]) => [k, sha(v)])) }, null, 1) + '\n');
}
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).cases;
const differ = (prefix) => Object.keys(got).filter((k) => k.startsWith(prefix)).filter((k) => gold[k] !== sha(got[k]));
const missing = Object.keys(gold).filter((k) => !(k in got));
chk(() => !missing.length && differ('M1:').length === 0, () => `M1: meaningOf differs from the base for ${differ('M1:').concat(missing).join(', ')}`);
chk(() => differ('N1:').length === 0, () => `N1: nativeFor differs from the base for ${differ('N1:').join(', ')}`);
chk(() => differ('S1:').length === 0, () => `S1: nativeFor with second: true differs from the base for ${differ('S1:').join(', ')}`);
chk(() => differ('R1:').length === 0, () => `R1: the plan's entries or lines differ from the base (${differ('R1:').join(', ')})`);
chk(() => differ('F1:').length === 0, () => 'F1: fitsCapabilities answers differently from the base');
chk(() => differ('X1:').length === 0, () => 'X1: an exported table or helper answers differently from the base');
// C1: the cases reach each branch the split moves (read from the answers, not the case names)
const N = Object.fromEntries(CASES.map((x, i) => [x[0], M.nativeFor(visualOf(x, i), optsOf(x))]));
const S = Object.fromEntries(CASES.map((x, i) => [x[0], M.nativeFor(visualOf(x, i), Object.assign({}, optsOf(x), { second: true }))]));
chk(() => N.bullet.native === 'lineClusteredColumnComboChart' && N.bullet.format.targetMarkers && N.bullet.second && S.bullet.secondChosen
  && N.calendar.native === 'pivotTable' && N.calendar.format.heat && N.calendar.added && N.calendarNone.lost.some((l) => /weekday and a month/.test(l)) && !N.calendarNoFn.second
  && N.mapPlace.native === 'azureMap' && N.mapPlace.second.native === 'clusteredBarChart' && N.mapPlace.needs.length > 3 && N.mapLatLon.second.native === 'tableEx'
  && N.search.format.search && N.search.format.headerOff && N.search.format.minHeight === 48 && S.search.native === 'textSlicer'
  && N.chips.format.dropdown && N.cloud.format.sortByValue && N.tornado.format.valueLabels && N.tornado.lost.some((l) => /names not shown/.test(l))
  && N.scatterLegend.kind === 'scatter' && !N.scatterLegend.roles.Series && N.timeline.expand === 1 && N.helperSort.lost.some((l) => /helper field/.test(l))
  && /set aside/.test(N.pieSetAside.why) && N.noFields.native === null && N.noFields.kind === 'unknown' && N.group.custom === false
  && repsEn.some((r) => r.panels) && repsEn.some((r) => r.second && r.second.chosen) && repsAr.some((r) => r.axes)
  && ['high', 'medium', 'low'].every((l) => Object.values(N).some((r) => r.confidence === l) || l === 'high')
  && got['F1:fits'].includes('"ok":false') && got['F1:fits'].includes('"ok":true'),
() => 'C1: the cases reach the closer natives, the second options, the slicer forms, the disclosure, the axes and the refusals');

// ---------- after the moves ----------
const src = fs.readFileSync(path.join(HERE, 'lib', 'visual-meaning.mjs'), 'utf8');
const defines = (names) => new RegExp(`(^|\\n)\\s*(export\\s+)?(const|function|let)\\s+(${names.join('|')})\\b`).test(src);
const load = async (f) => { try { return await import('./lib/' + f); } catch (e) { return null; } };
const CAP = await load('visual-capabilities.mjs'), CAND = await load('visual-candidates.mjs'), DIS = await load('replacement-disclosure.mjs');
if (CAP) chk(() => M.fitsCapabilities === CAP.fitsCapabilities && ['capsOf', 'drillsIn', 'roleLabel', 'isValue', 'isCol'].every((k) => typeof CAP[k] === 'function')
  && !defines(['capsOf', 'drillsIn', 'fitsCapabilities', 'roleLabel', 'isValue', 'isCol', 'VP']) && /from '\.\/visual-capabilities\.mjs'/.test(src) && !/powerbi-core-visual-schema|powerbi-report-authoring-cli/.test(src),
() => 'P1: visual-capabilities.mjs holds the capability validation; visual-meaning.mjs re-exports fitsCapabilities and defines none of it');
if (CAND) chk(() => M.NATIVE === CAND.NATIVE && M.FORMS === CAND.FORMS && ['candidatesOf', 'formOf', 'rankCandidates'].every((k) => typeof CAND[k] === 'function') && Array.isArray(CAND.CHARTS)
  && !defines(['NATIVE', 'CHARTS', 'candidatesOf', 'FORMS', 'formOf', 'rankCandidates']) && /from '\.\/visual-candidates\.mjs'/.test(src),
() => 'P2: visual-candidates.mjs holds the candidates and their ranking; visual-meaning.mjs re-exports NATIVE and FORMS and defines none of it');
if (DIS) chk(() => M.CONFIDENCE_LEVELS === DIS.CONFIDENCE_LEVELS && M.AZURE_NEEDS === DIS.AZURE_NEEDS && M.ownSettingsSaid === DIS.ownSettingsSaid && M.replacementLine === DIS.replacementLine && M.shortType === DIS.shortType
  && ['detailsOf', 'disclose', 'aOr'].every((k) => typeof DIS[k] === 'function') && typeof DIS.LABEL === 'object'
  && !defines(['LABEL', 'aOr', 'objName', 'AZURE_NEEDS', 'GEO_CATEGORY', 'formLost', 'KEPT', 'headOf', 'CONFIDENCE_LEVELS', 'ownSettingsSaid', 'detailsOf', 'disclose', 'shortType', 'replacementLine']) && /from '\.\/replacement-disclosure\.mjs'/.test(src),
() => 'P3: replacement-disclosure.mjs holds what the plan says about a replacement; visual-meaning.mjs re-exports its names and defines none of it');
if (CAP && CAND && DIS) {
  const files = ['visual-meaning.mjs', 'visual-vocabulary.mjs', 'visual-capabilities.mjs', 'visual-candidates.mjs', 'replacement-disclosure.mjs'].map((f) => [f, fs.readFileSync(path.join(HERE, 'lib', f), 'utf8')]);
  const lines = (t) => t.split('\n').length - (t.endsWith('\n') ? 1 : 0);
  chk(() => files.every(([, t]) => lines(t) < 600) && files.slice(2).every(([, t]) => /^\/\/ LAYER [^\n]*\n(\/\/[^\n]*\n)*?\/\/ Interface:/.test(t)),
  () => `P4: every file under 600 lines, every new module's header says its interface: ${files.map(([f, t]) => `${f} ${lines(t)}`).join(', ')}`);
}

if (problems.length) { console.log(`FAIL script=test-0.3.2-sp37.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp37  ${checks - problems.length}/${checks} checks`); process.exit(1); }
console.log(`PASS  sp37  ${checks} checks`);
