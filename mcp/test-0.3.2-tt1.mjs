import './test-env.mjs';
// 0.3.2 TT1 (mcp/work/TT1.md; written red first on 3914b36): three small twin fixes found by earlier builders. Made up only.
//   A1-A4  B-289: a table with two stale columnWidth entries (fields no longer in it, as Fintech p3's tasks have) against
//          its clean copy: its header grows as the copy's does, is not said cut, the stale entries stay in the file as
//          they are, and the two twins' files are equal but for those entries
//   B1-B5  B-290: MX2's watchlist (its first column, Department, 4 wide: hidden in English): the hidden columns (the
//          original 0 and the row label's 4) first, at the left end where Power BI starts the table against the box's
//          edge, as English's 4 sits at its left; never after the names. Edges, never centres (L-1102-07): every visible
//          column's left and right edge = MX2's + 4 (the hidden width now before it), the names' right edge at the
//          room's edge (the box less 20 and 12 at 1080 high, less 1), each within TOL px
//   C1-C6  B-302: a chart kept at its mirror under a heatmap's grid: the plan's line says its shift from the grid's
//          cells in px when over 2 px, in English and Arabic (HM2's A1-1 with its block: 31 px left; HM2's Call Center
//          shape: 16 px right); 2 px or less: the line as before; the lined-up line unchanged
//   node test-0.3.2-tt1.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const problems = []; let checks = 0;
const chk = (cond, msg) => { let ok = false, err = ''; try { ok = !!cond(); } catch (e) { err = ' (threw: ' + String(e && e.message || e).slice(0, 200) + ')'; } checks++; if (!ok) { let m = ''; try { m = msg(); } catch (e) { m = 'unexpected shape'; } problems.push(m + err); } };
const get = (fn) => { try { return fn(); } catch (e) { return { threw: String(e && e.stack || e).slice(0, 400) }; } };
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const wr = (f, j) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(j, null, 2) + '\n'); };
const clone = (o) => JSON.parse(JSON.stringify(o));
const J = (x) => JSON.stringify(x === undefined ? null : x), r2 = (n) => Math.round(n * 100) / 100;
const ROOT = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'dataarcus-tt1-')));
process.env.DATAARCUS_ROOT = ROOT;
const TOL = 0.5;
const L = (v) => ({ expr: { Literal: { Value: String(v) } } });
const lit = (p) => (p && p.expr && p.expr.Literal ? p.expr.Literal.Value : undefined);
const T = 'Work';
const col = (c) => ({ field: { Column: { Expression: { SourceRef: { Entity: T } }, Property: c } }, queryRef: T + '.' + c, nativeQueryRef: c });
const mea = (m) => ({ field: { Measure: { Expression: { SourceRef: { Entity: T } }, Property: m } }, queryRef: T + '.' + m, nativeQueryRef: m });
const widths = (ps, ws) => ps.map((p, i) => ({ properties: { value: L(ws[i] + 'D') }, selector: { metadata: p.queryRef } }));
const theme = (id) => ({ solid: { color: { expr: { ThemeDataColor: { ColorId: id, Percent: 0.1 } } } } });
const S = (s) => L("'" + s + "'");

try {
  // ---------- A, B: a twin project (the fixture twin-project with made-up Work fields), built in memory ----------
  const D = path.join(ROOT, 'w'), DEF = path.join(D, 'Twin Sales.Report/definition');
  fs.cpSync(path.join(HERE, 'fixtures/twin-project'), D, { recursive: true });
  const bimF = path.join(D, 'Twin Sales.SemanticModel/model.bim'), bim = rd(bimF);
  bim.model.tables.push({ name: T, columns: ['Department', 'Project', 'Owner'].map((name) => ({ name, dataType: 'string', sourceColumn: name })), measures: ['Revenue', 'Days Late', 'Risk Score'].map((m) => ({ name: m, expression: '1' })) }); wr(bimF, bim);
  const pj = path.join(DEF, 'pages/pages.json'), pages = rd(pj);
  const VS = 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/visualContainer/2.1.0/schema.json';
  const page = (id, name) => { pages.pageOrder.push(id); wr(path.join(DEF, 'pages', id, 'page.json'), { $schema: 'https://developer.microsoft.com/json-schemas/fabric/item/report/definition/page/2.0.0/schema.json', name: id, displayName: name, displayOption: 'FitToPage', width: 1280, height: 720 }); };
  const put = (pg, j) => wr(path.join(DEF, 'pages', pg, 'visuals', j.name, 'visual.json'), Object.assign({ $schema: VS }, j, { position: Object.assign({ tabOrder: j.position.z || 1000 }, j.position) }));
  // A: the same table twice, one with two stale entries (Fintech p3's tasks' shape: widths for fields no longer in it)
  page('p1stale', 'Stale');
  const ta = [col('Project'), col('Owner'), mea('Revenue')];
  const tbl = (name, x, stale) => ({ name, position: { x, y: 20, z: x + 1000, width: 600, height: 280 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: clone(ta) } } },
    objects: { columnWidth: widths(ta, [60, 50, 80]).concat(stale ? widths([col('Old Code'), col('Old Name')], [150, 100]) : []) } } });
  put('p1stale', tbl('tblStale', 20, true)); put('p1stale', tbl('tblClean', 660, false));
  // B: MX2's watchlist (Fintech p1's shape, made up)
  page('p2watch', 'Watch');
  const wl = [col('Department'), col('Project'), mea('Days Late'), mea('Risk Score')];
  put('p2watch', { name: 'tblWatch', position: { x: 760, y: 20, z: 1000, width: 490, height: 300 }, visual: { visualType: 'tableEx', query: { queryState: { Values: { projections: wl } } },
    objects: { columnWidth: widths(wl, [4, 187, 155.31992554168414, 106.62224457068305]), values: [{ properties: { wordWrap: L('false') } }], total: [{ properties: { totals: L('false') } }], columnHeaders: [{ properties: { backColor: theme(2), fontColor: theme(0), alignment: S('Center') } }] } } });
  wr(pj, pages);

  const { planTwin, twinTree } = await import('./lib/arabic-twin.mjs');
  const labels = { 'field:Work.Project': 'اسم المشروع الرئيسي في المحفظة', 'field:Work.Owner': 'المسؤول', 'field:Work.Revenue': 'الإيرادات', 'field:Work.Department': 'القسم', 'field:Work.Days Late': 'أيام التأخير المتوقعة', 'field:Work.Risk Score': 'مستوى المخاطر' };
  const P = get(() => planTwin({ path: 'w/Twin Sales.pbip', arabicMonth: false, labels })), files = get(() => twinTree(P).files);
  const at = (pg, n) => get(() => JSON.parse(String(files.find((f) => f.path.endsWith(`/pages/${pg}/visuals/${n}/visual.json`)).data)));
  const cw = (v) => (v.visual.objects.columnWidth || []).map((e) => [e.selector.metadata, parseFloat(lit(e.properties.value))]);
  const wOf = (v, r) => { const e = (v.visual.objects.columnWidth || []).find((x) => x.selector && x.selector.metadata === r); return e ? parseFloat(lit(e.properties.value)) : null; };
  if (!Array.isArray(files)) throw new Error('the twin builds: ' + J(P && P.threw || files && files.threw).slice(0, 400));

  // A1-A4 (B-289)
  const sT = at('p1stale', 'tblStale'), cT = at('p1stale', 'tblClean'), F = (P.answer && P.answer.fitted) || {};
  const shown = (v) => v.visual.query.queryState.Values.projections.map((p) => [p.queryRef, wOf(v, p.queryRef)]);
  const grown = (v) => shown(v).find(([r]) => /Row label: Project|Work\.Project$/.test(r) && wOf(v, r) >= 10);
  chk(() => grown(cT)[1] > 60 + 0.5 && Math.abs(grown(sT)[1] - grown(cT)[1]) < 0.01, () => `A1. the stale-entry table's header grows as its clean copy's does (only the current fields count in the spare room): stale ${J(shown(sT))}, clean ${J(shown(cT))}`);
  const cutOf = (n) => (F.headersCut || []).filter((x) => x.visual === n).map((x) => [x.column, x.cut, x.width]);
  chk(() => J(cutOf('tblStale')) === J(cutOf('tblClean')), () => `A2. said cut as its clean copy is: stale ${J(cutOf('tblStale'))}, clean ${J(cutOf('tblClean'))}`);
  chk(() => J(cw(sT).filter(([r]) => /Old /.test(r))) === J([['Work.Old Code', 150], ['Work.Old Name', 100]]), () => `A3 (guard). the stale entries stay in the twin's file as they are (the twin never deletes the person's settings): ${J(cw(sT))}`);
  const norm = (v, drop) => { const x = clone(v); delete x.name; delete x.position; if (drop) x.visual.objects.columnWidth = x.visual.objects.columnWidth.filter((e) => !/Old /.test(e.selector.metadata)); return J(x); };
  chk(() => norm(sT, true) === norm(cT, false), () => `A4. the two twins' files are equal but for the stale entries (name and box aside): stale ${J(cw(sT))}, clean ${J(cw(cT))}`);

  // B1-B5 (B-290): MX2 wrote [Department 0, Risk 121.35, Days 155.32, Project 187, Row label: Department 4]
  const wT = at('p2watch', 'tblWatch'), ws = shown(wT), sc = 720 / 1080;
  const MX2 = [['Work.Risk Score', 121.35], ['Work.Days Late', 155.31992554168414], ['Work.Project', 187]];
  chk(() => J(ws.slice(0, 2).map(([r]) => r)) === J(['Work.Department', 'Work.Row label: Department']) && ws[ws.length - 1][0] === 'Work.Project', () => `B1. the hidden columns first, at the left end, the names last (nothing after them): ${J(ws)}`);
  chk(() => wOf(wT, 'Work.Department') === 0 && wOf(wT, 'Work.Row label: Department') === 4, () => `B2 (guard). the hidden widths kept: 0 and 4: ${J(ws)}`);
  const vis = ws.filter(([, w]) => w >= 10);
  chk(() => vis.length === 3 && vis.every(([r, w], i) => r === MX2[i][0] && Math.abs(w - MX2[i][1]) < 0.01), () => `B3 (guard). the visible columns' order and widths as MX2 wrote them: ${J(vis)}`);
  // edges from the table's first column's start (Power BI lays a table from its box's left)
  const edgesOf = (list) => { let x = 0; const m = new Map(); list.forEach(([r, w]) => { m.set(r, [x, x + w]); x += w; }); return m; };
  const now = edgesOf(ws), was = edgesOf([['Work.Department', 0]].concat(MX2, [['Work.Row label: Department', 4]])), roomEdge = 490 - (20 + 12) * sc - 1, bad = [];
  MX2.forEach(([r]) => [0, 1].forEach((i) => { const a = (now.get(r) || [NaN, NaN])[i], b = was.get(r)[i] + 4; if (!(Math.abs(a - b) <= TOL)) bad.push(`${r} ${i ? 'right' : 'left'} ${r2(a)} (MX2 ${r2(was.get(r)[i])} + 4)`); }));
  const namesR = (now.get('Work.Project') || [NaN, NaN])[1];
  chk(() => !bad.length && Math.abs(namesR - roomEdge) <= TOL, () => `B4. every visible edge MX2's + 4 within ${TOL} px, the names' right edge at the room's edge ${r2(roomEdge)} within ${TOL} px: ${bad.join('; ')} names' right ${r2(namesR)}`);
  chk(() => Math.abs(ws.reduce((a, [, w]) => a + w, 0) - [...was.values()].reduce((a, e) => Math.max(a, e[1]), 0)) < 0.01, () => `B5 (guard). the columns' total unchanged: ${J(ws)}`);
} catch (e) { problems.push('A/B threw: ' + String(e && e.stack || e).slice(0, 600)); }

// ---------- C (B-302): through create_arabic_twin, as hm2 does ----------
try {
  const Plans = await import('./lib/plans.mjs');
  const { register } = await import('./tools/create_arabic_twin.mjs');
  let handler = null;
  register({ registerTool: (name, def, h) => { if (name === 'create_arabic_twin') handler = h; } }, {});
  const call = async (a) => { const r = await handler(a), t = (r.content || []).map((c) => c.text || '').join(''); let j = null; try { j = JSON.parse(t); } catch (e) { /* words */ } return { err: !!r.isError, t, j }; };
  const schema = (s) => 'https://developer.microsoft.com/json-schemas/fabric/' + s + '/schema.json';
  const VS = schema('item/report/definition/visualContainer/2.1.0');
  const materialize = (spec, dir) => {
    const w = (f, x) => wr(path.join(dir, f), x), DD = 'Synthetic.Report/definition';
    const fields = new Map(), measures = new Set(['Metric']);
    const walk = (x) => { if (!x || typeof x !== 'object') return; if (x.Column && x.Column.Property) fields.set(x.Column.Property, /Hour/.test(x.Column.Property) ? 'int64' : 'string'); if (x.Measure && x.Measure.Property) measures.add(x.Measure.Property); Object.values(x).forEach(walk); };
    walk(spec);
    w('Synthetic.pbip', { $schema: schema('pbip/pbipProperties/1.0.0'), version: '1.0', artifacts: [{ report: { path: 'Synthetic.Report' } }], settings: { enableAutoRecovery: true } });
    w('Synthetic.Report/.platform', { $schema: schema('gitIntegration/platformProperties/2.0.0'), metadata: { type: 'Report', displayName: 'Synthetic' }, config: { version: '2.0', logicalId: '11111111-2222-4333-8444-555555555555' } });
    w('Synthetic.Report/definition.pbir', { $schema: schema('item/report/definitionProperties/2.0.0'), version: '4.0', datasetReference: { byPath: { path: '../Synthetic.SemanticModel' } } });
    w('Synthetic.SemanticModel/definition.pbism', { $schema: schema('item/semanticModel/definitionProperties/1.0.0'), version: '4.0', settings: {} });
    w('Synthetic.SemanticModel/model.bim', { compatibilityLevel: 1567, model: { culture: 'en-US', tables: [{ name: 'Synthetic', columns: [...fields].map(([name, dataType]) => ({ name, dataType, sourceColumn: name })), measures: [...measures].map((name) => ({ name, expression: '1' })) }] } });
    w(DD + '/version.json', { $schema: schema('item/report/definition/versionMetadata/1.0.0'), version: '2.0.0' });
    w(DD + '/report.json', { $schema: schema('item/report/definition/report/2.1.0'), settings: { useStylableVisualContainerHeader: true } });
    const ids = spec.pages.map((p) => p.id);
    w(DD + '/pages/pages.json', { $schema: schema('item/report/definition/pagesMetadata/1.0.0'), pageOrder: ids, activePageName: ids[0] });
    spec.pages.forEach((p) => {
      w(DD + '/pages/' + p.id + '/page.json', { $schema: schema('item/report/definition/page/2.0.0'), name: p.id, displayName: 'Synthetic page', displayOption: 'FitToPage', width: p.width, height: p.height });
      for (const v of p.visuals) w(DD + '/pages/' + p.id + '/visuals/' + v.name + '/visual.json', v);
    });
  };
  const planOf = async (spec, name) => { const dir = path.join(ROOT, name); fs.mkdirSync(dir); materialize(spec, dir); const p = await call({ path: name + '/Synthetic.pbip', arabicMonth: false }); if (!p.j || !p.j.plan) throw new Error('no plan: ' + p.t.slice(0, 300)); return { plan: p.j.plan, size: p.t.length, pj: p.j }; };
  const entry = (r, where) => ((r.plan.movedByRule || r.pj.movedByRule || (r.pj.answer || {}).movedByRule || []).find((x) => x.where === where) || {});
  const findMoves = (o, where, d = 0) => { if (!o || typeof o !== 'object' || d > 6) return null; if (Array.isArray(o.movedByRule)) { const e = o.movedByRule.find((x) => x.where === where); if (e) return e; } for (const v of Object.values(o)) { const f = findMoves(v, where, d + 1); if (f) return f; } return null; };
  const noDash = (s) => !/—/.test(s);

  const a1 = JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/hm2/A1-1.json'), 'utf8'));
  a1.pages[0].visuals.push({ $schema: VS, name: 'block', position: { x: 255, y: 440, width: 15, height: 60, z: 3000, tabOrder: 3000 }, visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: L("'rectangle'") } }] } } });
  const ra = await planOf(a1, 'A'), ea = findMoves(ra.pj, 'p0/v1') || entry(ra, 'p0/v1');
  chk(() => /kept at its mirror/.test(ea.rule) && /stands 31 px left of its grid's cells/.test(ea.rule) && noDash(ea.rule), () => `C1. A1-1 kept at its mirror (shift -31.34): the line says it stands 31 px left of its grid's cells: ${J(ea)}`);
  chk(() => typeof ea.ruleAr === 'string' && /31/.test(ea.ruleAr) && /[؀-ۿ]/.test(ea.ruleAr) && /يسار/.test(ea.ruleAr) && noDash(ea.ruleAr), () => `C2. and in Arabic (ruleAr): ${J(ea.ruleAr)}`);

  const ccol = (n) => ({ field: { Column: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
  const cmea = (n) => ({ field: { Measure: { Expression: { SourceRef: { Entity: 'Synthetic' } }, Property: n } }, queryRef: 'Synthetic.' + n, nativeQueryRef: n });
  const heat = { $schema: VS, name: 'heat', position: { x: 543.33, y: 434.17, width: 317.5, height: 188.33, z: 26000, tabOrder: 26000 }, visual: { visualType: 'pivotTable',
    query: { queryState: { Rows: { projections: [Object.assign(ccol('Weekday'), { displayName: ' ' })] }, Columns: { projections: [ccol('Call Hour')] }, Values: { projections: [cmea('Calls')] } } },
    objects: { subTotals: [{ properties: { rowSubtotals: L('false'), columnSubtotals: L('false') } }], grid: [{ properties: { textSize: L('10D') } }], columnWidth: [{ properties: { value: L('38.06D') }, selector: { metadata: 'Synthetic.Weekday' } }] },
    visualContainerObjects: { padding: [{ properties: { right: L('6D') } }] } } };
  const hours = { $schema: VS, name: 'hours', position: { x: 557.5, y: 603.75, width: 310, height: 82.5, z: 28000, tabOrder: 28000 }, visual: { visualType: 'columnChart',
    query: { queryState: { Category: { projections: [ccol('Call Hour')] }, Y: { projections: [cmea('Calls')] } }, sortDefinition: { sort: [{ field: ccol('Call Hour').field, direction: 'Ascending' }] } },
    objects: { categoryAxis: [{ properties: { show: L('false') } }], valueAxis: [{ properties: { show: L('false') } }] },
    visualContainerObjects: { padding: [{ properties: { left: L('0D'), right: L('20D') } }] } } };
  const block = { $schema: VS, name: 'block', position: { x: 870, y: 610, width: 15, height: 60, z: 29000, tabOrder: 29000 }, visual: { visualType: 'shape', objects: { shape: [{ properties: { tileShape: L("'rectangle'") } }] } } };
  const rc = await planOf({ pages: [{ id: 'cc', width: 1280, height: 800, visuals: [heat, hours, block] }] }, 'C'), ec = findMoves(rc.pj, 'cc/hours') || {};
  chk(() => /kept at its mirror/.test(ec.rule) && /stands 16 px right of its grid's cells/.test(ec.rule), () => `C3. the Call Center shape (shift 16.22): 16 px right: ${J(ec)}`);
  chk(() => typeof ec.ruleAr === 'string' && /16/.test(ec.ruleAr) && /يمين/.test(ec.ruleAr), () => `C4. and in Arabic: ${J(ec.ruleAr)}`);
  // the 2 px boundary, on the line's own function
  const TP = await import('./lib/twin-pages.mjs'), line = TP.keptAtMirrorLine;
  const l2 = get(() => line('x', 2)), l3 = get(() => line('x', -2.01)), l0 = get(() => line('x', 0));
  chk(() => typeof line === 'function' && J(l2) === J(l0) && !/px/.test(l2.rule) && l2.ruleAr === undefined && /stands 2 px left/.test(l3.rule) && /2/.test(l3.ruleAr),
    () => `C5. 2 px or less: the line as before (no px, no Arabic); over 2: said: ${J({ l0, l2, l3 })}`);
  // the lined-up line (A1-1 as it is: lined up, HM1) unchanged
  const rl = await planOf(JSON.parse(fs.readFileSync(path.join(HERE, 'fixtures/hm2/A1-1.json'), 'utf8')), 'L'), el = findMoves(rl.pj, 'p0/v1') || {};
  chk(() => el.rule === 'kept lined up with its heatmap\'s grid, as English: its offset, padding, axis side and sort (the grid reads left to right)' && el.ruleAr === undefined, () => `C6 (guard). the lined-up line unchanged: ${J(el)}`);
  if (process.env.TT1_SHOW) console.log(J({ sizeA: ra.size, sizeC: rc.size, sizeL: rl.size, ea, ec }));
} catch (e) { problems.push('C threw: ' + String(e && e.stack || e).slice(0, 600)); }

fs.rmSync(ROOT, { recursive: true, force: true });
if (problems.length) { console.log(`FAIL script=test-0.3.2-tt1.mjs cause=${problems.length} of ${checks} checks failed`); problems.forEach((x) => console.log('  - ' + x)); console.log(`FAIL  twin-tt1  ${checks - problems.length} of ${checks} checks`); process.exit(1); }
console.log(`PASS  twin-tt1  ${checks} checks`);
