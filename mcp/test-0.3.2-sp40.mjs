import './test-env.mjs';
// 0.3.2 SP40 (the split: B-280, B-286; mcp/work/SP40.md). A characterisation suite for the Arabic twin's measure
// rewiring: the twin's own copy of reportExtensions.json, the title measures ("Title AR: ...", each name free), the text
// measures ("No data AR: ..." in one report with both languages, else rewritten), the waterfall's and the tables' row
// label measures (one for the same DAX in the same table), the visuals moved to them, and what the plan says of them;
// with keepSize last (a chart near its 60 px floor) and a phone layout. For 25 runs of create_arabic_twin (the plan with
// every text given an Arabic, the click, the write), the plan's text and every file of the folder after the write are
// byte for byte the ones recorded on the base (integration/0.3.2 8951549, before the measures moved from
// lib/twin-pages.mjs to lib/twin-measures.mjs). The runs' flow is sp11's (fixtures/twin-runs.mjs: one fixed seed,
// normalised plan id and working folder). Recorded in fixtures/sp40-twins.json; SP40_RECORD=1 records them again (only
// on the base, never to make a run pass); SP40_DUMP=<file> writes what was compared. Made-up reports only.
//   T1-T23  sp26's runs (sp11's 18: the guards' fixtures, twin-fuzz's cases and seeds, hm2's A1-1, the fitting project;
//           hm1's three heatmaps; the geometry project)
//   T24-T25 the measures project (its own report, both languages in one)
//   C1  the runs reach every measure path, keepSize's floor and the phone's tabs
//   after the move: M1  twin-pages.mjs defines none of the measure parts, imports them from twin-measures.mjs and
//   calls them in the base's order, keepSize last with its 0.75 and 60;  M2  twin-measures.mjs holds no module state,
//   does no IO and lists no visual type of its own
//   node test-0.3.2-sp40.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const GOLD = path.join(HERE, 'fixtures', 'sp40-twins.json');
const H = await import('./fixtures/twin-runs.mjs');
const { ROOT, T, L, Q, obj, col, mea, box, cw, put, rd, schema, lf } = H;

// ---- the measures project (made up): twin-project with its own reportExtensions.json and a page "msr" (1280 x 720) ----
// cT1: a card titled by "Title: Top regions" (a variable in its text; "Title AR: Top regions" is taken, so the twin's is
// "(2)"); cT2: a column chart titled by an IF of two texts; cT3: a bar chart titled with FORMAT (not translated, still
// shown; given an approved fixed Arabic title, it is said "fixed"); cT4: a card titled by a measure of the model (the
// same); cND: a card showing the text measure "No data: Orders", a selector naming it; tRL1, tRL2: two tables with the
// same columns, a text column first (one row label measure for both, "(2)": the matrix written as a table took the
// first name; tRL1's text column coloured, its row label column takes the colour); wf1, wf2: two waterfalls of the
// same measure by month (mirrored: one set of measures); mx: a matrix with a column chart (colFloor, 72 wide) in its right margin, cut to 56 (78 %, over KEEP_MIN but under the 60 px
// floor: keepSize puts it back);
// tabA, tabB: page tabs on the phone with an underline (lnA) under tabA; cND and cT1 on the phone too.
const extM = (m) => ({ Measure: { Expression: { SourceRef: { Schema: 'extension', Entity: T } }, Property: m } });
const titleBy = (m) => ({ title: obj({ show: L('true'), text: { expr: m } }) });
const MOB = schema('item/report/definition/visualContainerMobileState/2.1.0');
const tab = (name, x, text, to, z) => box(name, x, 660, 140, 40, z, { visualType: 'actionButton', objects: { text: obj({ show: L('true'), text: Q(text) }) },
  visualContainerObjects: { visualLink: obj({ show: L('true'), type: Q('PageNavigation'), navigationSection: Q(to) }) } });
function measureProject(dir) {
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), dir, { recursive: true }); lf(dir);
  const DEF = path.join(dir, 'Twin Sales.Report/definition');
  put(path.join(DEF, 'reportExtensions.json'), { $schema: schema('item/report/definition/reportExtension/1.0.0'), name: 'extension', entities: [{ name: T, measures: [
    { name: 'Title: Top regions', dataType: 'Text', expression: 'VAR n = 5 RETURN "Top " & n & " regions"' },
    { name: 'Title AR: Top regions', dataType: 'Text', expression: '"Taken by the report"' },
    { name: 'Title: Sales trend', dataType: 'Text', expression: 'IF ( ISFILTERED ( Sales[Region] ), "Sales in the region", "Sales in every region" )' },
    { name: 'Title: Year', dataType: 'Text', expression: '"Sales in " & FORMAT ( TODAY (), "yyyy" )' },
    { name: 'No data: Orders', dataType: 'Text', expression: 'IF ( ISBLANK ( [Orders] ), "No data for this selection", "" )' }] }] });
  const nd = { field: extM('No data: Orders'), queryRef: 'Sales.No data: Orders', nativeQueryRef: 'No data: Orders' };
  const table = (name, y, z, more) => box(name, 360, y, 400, 190, z, { visualType: 'tableEx', query: { queryState: { Values: { projections: [col(T, 'Region'), mea(T, 'Total Sales'), mea(T, 'Orders')] } } },
    objects: Object.assign({ columnWidth: [cw('Sales.Region', 120), cw('Sales.Total Sales', 110), cw('Sales.Orders', 90)] }, more || {}) });
  const wf = (name, y, z) => box(name, 800, y, 440, 190, z, { visualType: 'waterfallChart', query: { queryState: { Category: { projections: [col('Calendar', 'Month Name')] }, Y: { projections: [mea(T, 'Total Sales')] } } } });
  const vs = [
    box('cT1', 40, 40, 300, 110, 1000, { visualType: 'card', query: { queryState: { Values: { projections: [mea(T, 'Orders')] } } }, visualContainerObjects: titleBy(extM('Title: Top regions')) }),
    box('cT2', 360, 40, 400, 190, 2000, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col(T, 'Region')] }, Y: { projections: [mea(T, 'Total Sales')] } } }, visualContainerObjects: titleBy(extM('Title: Sales trend')) }),
    box('cT3', 800, 40, 440, 190, 3000, { visualType: 'clusteredBarChart', query: { queryState: { Category: { projections: [col(T, 'Product')] }, Y: { projections: [mea(T, 'Orders')] } } }, visualContainerObjects: titleBy(extM('Title: Year')) }),
    box('cT4', 40, 170, 300, 110, 4000, { visualType: 'card', query: { queryState: { Values: { projections: [mea(T, 'Total Sales')] } } }, visualContainerObjects: titleBy({ Measure: { Expression: { SourceRef: { Entity: T } }, Property: 'Total Sales' } }) }),
    box('cND', 40, 300, 300, 100, 5000, { visualType: 'card', query: { queryState: { Values: { projections: [nd] } } }, objects: { labels: [{ properties: { fontSize: L('12D') }, selector: { metadata: 'Sales.No data: Orders' } }] } }),
    table('tRL1', 250, 6000, { columnFormatting: [{ properties: { fontColor: { solid: { color: Q('#1F6E43') } } }, selector: { metadata: 'Sales.Region' } }] }), table('tRL2', 460, 7000), wf('wf1', 250, 8000), wf('wf2', 460, 9000),
    box('mx', 40, 420, 280, 220, 10000, { visualType: 'pivotTable', query: { queryState: { Rows: { projections: [col(T, 'Region')] }, Values: { projections: [mea(T, 'Total Sales')] } } } }),
    box('colFloor', 304, 440, 72, 180, 11000, { visualType: 'clusteredColumnChart', query: { queryState: { Category: { projections: [col(T, 'Product')] }, Y: { projections: [mea(T, 'Orders')] } } } }),
    tab('tabA', 800, 'Overview', 'p1overview', 12000), tab('tabB', 950, 'Details', 'p2details', 13000),
    box('lnA', 805, 700, 130, 3, 14000, { visualType: 'shape', objects: { shape: obj({ tileShape: Q('rectangle') }) } })
  ];
  const mobile = { tabA: [10, 0, 55, 30], tabB: [70, 0, 55, 30], lnA: [12, 30, 51, 3], cT1: [0, 40, 320, 110], cND: [0, 160, 320, 100] };
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj); pages.pageOrder.push('msr'); put(pj, pages);
  put(path.join(DEF, 'pages/msr/page.json'), { $schema: schema('item/report/definition/page/2.0.0'), name: 'msr', displayName: 'Measures', displayOption: 'FitToPage', width: 1280, height: 720 });
  vs.forEach((v) => { put(path.join(DEF, 'pages/msr/visuals', v.name, 'visual.json'), v);
    const m = mobile[v.name]; if (m) put(path.join(DEF, 'pages/msr/visuals', v.name, 'mobile.json'), { $schema: MOB, position: { x: m[0], y: m[1], z: v.position.z, width: m[2], height: m[3], tabOrder: v.position.z } }); });
}
// (a title's Arabic keeps its {1}: the lab's Arabic has none, so it is given here)
const MEASURE_AR = { 'titleText:Top {1} regions': 'أعلى {1} مناطق' };
const CASES = H.SP26_CASES.concat([
  ['T24 the measures project, its own report', 'm1', () => measureProject(path.join(ROOT, 'm1')), { path: 'm1/Twin Sales.pbip', arabicMonth: false, waterfallRtl: 'mirror' }, MEASURE_AR],
  ['T25 the measures project, both languages in one report', 'm2', () => measureProject(path.join(ROOT, 'm2')), { path: 'm2/Twin Sales.pbip', arabicMonth: false, waterfallRtl: 'mirror', into: 'same' }, MEASURE_AR]
]);

const { got, plans } = await H.runCases(CASES, problems);
if (process.env.SP40_DUMP) fs.writeFileSync(process.env.SP40_DUMP, JSON.stringify({ got, plans }, null, 1));
const now = H.summary(got);
if (process.env.SP40_RECORD) fs.writeFileSync(GOLD, JSON.stringify({ about: 'test-0.3.2-sp40.mjs: create_arabic_twin\'s plan and write answers and every file of each folder after the write, recorded on the base (normalised: the plan id, the working folder and the path separator)', runs: now }, null, 1) + '\n');
const gold = JSON.parse(fs.readFileSync(GOLD, 'utf8')).runs;
for (const [name] of CASES) chk(() => gold[name] && JSON.stringify(now[name]) === JSON.stringify(gold[name]),
  () => `${name.split(' ')[0]}. "${name.replace(/^T\d+ /, '')}": the twin's plan, its write and the folder's files are the base's, byte for byte: now ${JSON.stringify(now[name])}, recorded ${JSON.stringify(gold[name] || null)} (SP40_DUMP=<file> writes them)`);

// ---- C1: the runs reach every measure path, keepSize's floor and the phone's tabs (the measures project's twins) ----
const said = Object.values(got).map((v) => v.plan.t).join('\n');
const reportOf = (dir) => { try { const d = fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.Report') && f !== 'Twin Sales.Report'); return d.length ? path.join(ROOT, dir, d[0], 'definition') : path.join(ROOT, dir, 'Twin Sales.Report', 'definition'); } catch (e) { return null; } };
const extOf = (dir) => { try { return rd(path.join(reportOf(dir), 'reportExtensions.json')); } catch (e) { return null; } };
const measuresOf = (dir) => Object.fromEntries(((extOf(dir) || {}).entities || []).flatMap((e) => (e.measures || []).map((m) => [e.name + '[' + m.name + ']', m])));
const visualsOf = (dir, name) => { const p = path.join(reportOf(dir) || '', 'pages'); const out = []; try { fs.readdirSync(p).forEach((pg) => { const f = path.join(p, pg, 'visuals', name, 'visual.json'); if (fs.existsSync(f)) out.push(rd(f)); }); } catch (e) { /* none */ } return out; };
const mobilesOf = (dir, name) => { const p = path.join(reportOf(dir) || '', 'pages'); const out = []; try { fs.readdirSync(p).forEach((pg) => { const f = path.join(p, pg, 'visuals', name, 'mobile.json'); if (fs.existsSync(f)) out.push(rd(f)); }); } catch (e) { /* none */ } return out; };
const allVisuals = (dir) => { const p = path.join(reportOf(dir) || '', 'pages'), out = []; try { fs.readdirSync(p).forEach((pg) => { const d = path.join(p, pg, 'visuals'); if (fs.existsSync(d)) fs.readdirSync(d).forEach((n) => { const f = path.join(d, n, 'visual.json'); if (fs.existsSync(f)) out.push(rd(f)); }); }); } catch (e) { /* none */ } return out; };
const m1 = measuresOf('m1'), m2 = measuresOf('m2'), titleProp = (v) => { try { return v.visual.visualContainerObjects.title[0].properties.text.expr.Measure.Property; } catch (e) { return null; } };
const COVER = {
  'every twin written': Object.values(got).every((v) => v.write && !v.write.err),
  'a title measure with a variable, its name taken: "(2)"': !!m1['Sales[Title AR: Top regions (2)]'] && /UNICHAR \( 8296 \) & n/.test(m1['Sales[Title AR: Top regions (2)]'].expression) && visualsOf('m1', 'cT1').some((v) => titleProp(v) === 'Title AR: Top regions (2)'),
  'a title measure of two branches': !!m1['Sales[Title AR: Sales trend]'] && /^IF \( ISFILTERED/.test(m1['Sales[Title AR: Sales trend]'].expression) && /\p{Script=Arabic}/u.test(m1['Sales[Title AR: Sales trend]'].expression),
  'title measures given fixed Arabic titles (FORMAT, the model\'s), said': /"measure":"Sales\[Title: Year\]","why":"every title it gave is written as its approved fixed Arabic title/.test(said) && /"measure":"Sales\[Total Sales\]","why":"every title it gave/.test(said),
  'the original\'s title measures left, said (own report)': /the original's title measure: the twin's charts use their own Arabic one instead/.test(said),
  'a text measure rewritten (own report)': !!m1['Sales[No data: Orders]'] && /\p{Script=Arabic}/u.test(m1['Sales[No data: Orders]'].expression) && !m1['Sales[No data AR: Orders]'],
  'a text measure of its own (both languages), its visual moved to it': !!m2['Sales[No data AR: Orders]'] && /No data for this selection/.test((m2['Sales[No data: Orders]'] || {}).expression)
    && allVisuals('m2').some((v) => { const ps = ((((v.visual || {}).query || {}).queryState || {}).Values || {}).projections, p = ps && ps[0]; return p && p.field.Measure && p.field.Measure.Property === 'No data AR: Orders' && p.queryRef === 'Sales.No data AR: Orders' && p.nativeQueryRef === 'No data AR: Orders' && v.visual.objects.labels[0].selector.metadata === 'Sales.No data AR: Orders'; }),
  'one row label measure for two tables of the same DAX, a free name for another': !!m1['Sales[Row label: Region]'] && !!m1['Sales[Row label: Region (2)]'] && visualsOf('m1', 'tRL1').concat(visualsOf('m1', 'tRL2')).filter((v) => v.visual.query.queryState.Values.projections.some((p) => p.nativeQueryRef === 'Row label: Region (2)')).length === 2,
  'the row label column keeps its text column\'s colour': visualsOf('m1', 'tRL1').some((v) => v.visual.objects.columnFormatting.some((e) => e.selector.metadata === 'Sales.Row label: Region (2)' && JSON.stringify(e.properties.fontColor || null).includes('#1F6E43'))),
  'the waterfall\'s measures, one for the same DAX': Object.keys(m1).filter((k) => /^Sales\[Waterfall /.test(k)).length === 7 && !Object.keys(m1).some((k) => /^Sales\[Waterfall .*\(2\)\]$/.test(k)) && visualsOf('m1', 'wf1').concat(visualsOf('m1', 'wf2')).every((v) => v.visual.visualType !== 'waterfallChart'),
  'keepSize: a chart cut to 56 px (78 %) kept its English size': /"where":"msr\/colFloor","what":"kept its English size: a rule would have shrunk it to 56 px wide and 180 px high \(English 72 x 180\)"/.test(said) && visualsOf('m1', 'colFloor').some((v) => v.position.width === 72),
  'the phone\'s tabs as wide as their Arabic names': mobilesOf('m1', 'tabA').some((m) => m.position.width !== 55) && mobilesOf('m1', 'lnA').some((m) => m.position.x !== 12)
};
chk(() => Object.values(COVER).every(Boolean), () => `C1. the runs reach every measure path: missing ${JSON.stringify(Object.keys(COVER).filter((k) => !COVER[k]))}`);

// ---------- after the move (SP40): twin-pages.mjs calls the measures it imports from twin-measures.mjs ----------
const SRC = (f) => fs.readFileSync(path.join(HERE, 'lib', f), 'utf8');
if (fs.existsSync(path.join(HERE, 'lib', 'twin-measures.mjs'))) {
  const pages = SRC('twin-pages.mjs'), ms = SRC('twin-measures.mjs'), M = await import('./lib/twin-measures.mjs');
  const calls = ['twinMeasures(P, labels)', 'Mirror.mirrorPage(', 'badgesWithText(pg, r)', 'Mirror.labelVisual(', 'wholeTitles(vj.visual', 'M.rewire(vj', 'indentToEnd(pg.visuals[i].json, vj)', 'fitButtons(page', 'fitHeaders(page', 'keepView(page, r.visuals', 'growTables(r.visuals', 'fitTextboxes(page', 'iconRoom(r.visuals', 'keepSize(pg.visuals', 'Mirror.mirrorMobile(', 'fitPhoneTabs(pg, r.visuals', 'M.said(pages'].map((c) => pages.indexOf(c));
  const gone = ['rewireMeasures', 'rowLabelTable', 'fieldOk', 'takenAnywhere', 'rowLabelMeasure', 'textRename', 'wfWritten', 'rlWritten', 'shownTitle', 'stillShown', 'notTranslated', 'fixedTitles', 'EXT_SCHEMA'];
  chk(() => typeof M.twinMeasures === 'function' && typeof M.rewireMeasures === 'function' && typeof M.rowLabelTable === 'function'
    && gone.every((h) => !new RegExp('\\b' + h + '\\b').test(pages)) && !/\b(titleMeasuresOf|textMeasuresOf|arabicDax|waterfallFacts)\b/.test(pages.replace(/^import .*$/gm, ''))
    && /^import \{ twinMeasures \} from '\.\/twin-measures\.mjs';$/m.test(pages)
    && calls.every((i, k) => i > 0 && (k === 0 || i > calls[k - 1]))
    && /^export const KEEP_MIN = 0\.75, CHART_MIN = 60;$/m.test(pages) && /a\[k\] < b\[k\] \* KEEP_MIN \|\| \(chart\(e\) && a\[k\] < CHART_MIN && b\[k\] >= CHART_MIN\)/.test(pages),
  () => `M1 twin-pages.mjs defines none of the measure parts (${gone.join(', ')}), imports twinMeasures from twin-measures.mjs and calls the steps in the base's order (the measures, the mirror, badges, labels, titles, the measures' rewiring, indentation, buttons, headers, the view, grown tables, text boxes, icon room, keepSize with 0.75 and 60, the phone, its tabs, what is said): ${JSON.stringify(calls)}`);
  chk(() => !/^(let|var) /m.test(ms) && !/node:fs|readFileSync|writeFileSync|process\.|globalThis|Date\.now|Math\.random/.test(ms)
    && [...ms.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]).every((m) => ['./read-report.mjs', './twin-read.mjs', './twin-visuals.mjs', './twin-texts.mjs', './twin-model.mjs', 'node:module'].includes(m))
    && !/'(matrix|pivotTable|card|clusteredBarChart|clusteredColumnChart|waterfallChart|textbox|actionButton)'/.test(ms),
  () => 'M2 twin-measures.mjs holds no module state (no top-level let or var), does no IO (no fs, process, clock or randomness), imports only read-report, twin-read, twin-visuals, twin-texts, twin-model and the engines, and lists no visual type of its own (a table is typeOf\'s tableEx, as the base reads it)');
}

if (!process.env.SP40_KEEP) fs.rmSync(ROOT, { recursive: true, force: true });   // (SP40_KEEP=1: the folders kept, to look at)
if (problems.length) { console.log(`FAIL script=test-0.3.2-sp40.mjs cause=${problems[0].slice(0, 300)}`); problems.forEach((p) => console.log('  - ' + p)); console.log(`FAIL  sp40  ${problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  sp40  ${checks} checks`);
